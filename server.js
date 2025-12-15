// Gnani Live Demo Backend (Node + Express)
// Provides:
// - POST /api/start-call : triggers outbound call via Twilio (optional)
// - GET /health : health check
//
// IMPORTANT:
// - Set environment variables in .env (see .env.example)
// - For production, put this behind a reverse proxy with HTTPS
//
// Run:
//   npm install
//   npm run dev

import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(helmet({
  contentSecurityPolicy: false // keep simple for demo; tighten in prod
}));
app.use(express.json({ limit: "64kb" }));

const allowedOrigins = (process.env.CORS_ALLOW_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function(origin, cb){
    if(!origin) return cb(null, true);
    if(allowedOrigins.length === 0) return cb(null, true);
    if(allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked"));
  },
  methods: ["GET","POST"]
}));

// Rate limits: protect abuse
const startCallLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE || "6"),
  standardHeaders: true,
  legacyHeaders: false
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static hosting for the frontend
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1h",
  etag: true
}));

app.get("/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

function normalizePhone(input){
  let p = String(input || "").trim();
  p = p.replace(/[\s\-\(\)\.]/g, "");
  p = p.replace(/(?!^)\+/g, "");
  return p;
}

function isValidPhone(p){
  const x = normalizePhone(p);
  const digits = x.startsWith("+") ? x.slice(1) : x;
  if(!/^\d+$/.test(digits)) return false;
  if(digits.length < 8 || digits.length > 15) return false;
  return true;
}

function requestId(){
  return crypto.randomBytes(10).toString("hex");
}

function sha256(s){
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

function getTwilioClient(){
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if(!sid || !token) return null;
  return twilio(sid, token);
}

// Optional: store logs in-memory for demo.
// In production, send to your datastore.
const logs = [];

app.post("/api/start-call", startCallLimiter, async (req, res) => {
  const { industryKey, industryName, useCaseKey, useCaseName, phone } = req.body || {};
  const rid = requestId();

  const p = normalizePhone(phone);
  if(!industryKey || !useCaseKey || !industryName || !useCaseName){
    return res.status(400).json({ requestId: rid, error: "Missing industry or use case." });
  }
  if(!p || !isValidPhone(p)){
    return res.status(400).json({ requestId: rid, error: "Invalid phone number." });
  }

  // Basic per-number throttle (hash-based)
  const phoneHash = sha256(p);
  const now = Date.now();
  const recent = logs.filter(x => x.phoneHash === phoneHash && (now - x.ts) < 60 * 1000);
  if(recent.length >= Number(process.env.PER_NUMBER_PER_MINUTE || "2")){
    return res.status(429).json({ requestId: rid, error: "Too many requests for this number. Retry shortly." });
  }

  const entry = {
    requestId: rid,
    ts: now,
    industryKey,
    industryName,
    useCaseKey,
    useCaseName,
    phoneHash,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || null
  };
  logs.push(entry);

  const mode = (process.env.CALL_PROVIDER_MODE || "mock").toLowerCase();

  try{
    if(mode === "twilio"){
      const client = getTwilioClient();
      if(!client){
        return res.status(500).json({ requestId: rid, error: "Twilio is not configured." });
      }

      const from = process.env.TWILIO_FROM_NUMBER;
      const twimlUrl = process.env.TWILIO_TWIML_URL;

      if(!from || !twimlUrl){
        return res.status(500).json({ requestId: rid, error: "Missing TWILIO_FROM_NUMBER or TWILIO_TWIML_URL." });
      }

      // Pass metadata to your TwiML endpoint so the voice flow can adapt.
      const url = new URL(twimlUrl);
      url.searchParams.set("industryKey", industryKey);
      url.searchParams.set("industryName", industryName);
      url.searchParams.set("useCaseKey", useCaseKey);
      url.searchParams.set("useCaseName", useCaseName);
      url.searchParams.set("requestId", rid);

      const call = await client.calls.create({
        to: p,
        from,
        url: url.toString(),
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || undefined,
        statusCallbackEvent: ["initiated","ringing","answered","completed"],
        statusCallbackMethod: "POST"
      });

      entry.provider = "twilio";
      entry.providerCallSid = call.sid;
      entry.status = "created";

      return res.status(200).json({ requestId: rid, provider: "twilio", callSid: call.sid });
    }

    // Default: mock mode, returns success without dialing.
    entry.provider = "mock";
    entry.status = "created";

    return res.status(200).json({ requestId: rid, provider: "mock" });

  } catch(err){
    entry.status = "error";
    entry.error = String(err && err.message ? err.message : err);
    return res.status(500).json({ requestId: rid, error: "Call provider error." });
  }
});

// Simple TwiML generator (optional)
// If you do not have your own TwiML URL, you can use this endpoint by setting TWILIO_TWIML_URL to:
//   https://YOUR_DOMAIN/twiml
//
// This demo TwiML plays a short message. Replace with your real voice agent integration.
app.get("/twiml", (req, res) => {
  const industryName = String(req.query.industryName || "your industry");
  const useCaseName = String(req.query.useCaseName || "your workflow");
  const requestId = String(req.query.requestId || "");

  // Minimal XML. Keep it simple.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello. This is Gnani AI. You selected ${escapeXml(industryName)} and ${escapeXml(useCaseName)}.</Say>
  <Pause length="1"/>
  <Say voice="alice">This is a demo call. In production, the agent would run the full workflow using your systems and policies.</Say>
  <Pause length="1"/>
  <Say voice="alice">Reference ID ${escapeXml(requestId)}. Thank you.</Say>
</Response>`;

  res.type("text/xml").send(xml);
});

function escapeXml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const port = Number(process.env.PORT || "3000");
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
