/* Gnani Live Demo Frontend
   Flow: Industry -> Use case -> Phone -> Start call -> Post-call actions
*/

const CONFIG = {
  apiBase: "", // same origin by default. If API is on another domain, set like "https://api.gnani.ai"
  maxPhoneLen: 18
};

const INDUSTRIES = [
  {
    key: "bfsi",
    name: "BFSI",
    outcome: "Automate collections, onboarding, and service workflows at scale.",
    useCases: [
      { key: "collections", name: "EMI reminders and collections", desc: "Outbound and inbound AI handling repayment conversations." },
      { key: "lead_qual", name: "Lead qualification", desc: "AI screens and prioritizes high-intent leads automatically." },
      { key: "kyc_followup", name: "KYC and document follow-ups", desc: "Voice-led completion of pending onboarding tasks." },
      { key: "cust_service", name: "Customer service automation", desc: "Resolve FAQs and tasks with clear handoff paths." },
      { key: "risk_verify", name: "Risk verification", desc: "Verify identity and intent before sensitive actions." }
    ]
  },
  {
    key: "insurance",
    name: "Insurance",
    outcome: "Handle claims, renewals, and customer service end to end.",
    useCases: [
      { key: "claims_intake", name: "Claims intake", desc: "Capture incident details and route to the right workflow." },
      { key: "renewals", name: "Renewals and reminders", desc: "Proactive renewal calls with policy context." },
      { key: "policy_serv", name: "Policy service", desc: "Address endorsements, updates, and status checks." },
      { key: "agent_assist", name: "Agent assist handoff", desc: "Seamless transfer with a short context summary." }
    ]
  },
  {
    key: "automotive",
    name: "Automotive",
    outcome: "Qualify leads, book test drives, and follow up automatically.",
    useCases: [
      { key: "test_drive", name: "Test drive scheduling", desc: "Book slots, confirm details, and send reminders." },
      { key: "lead_qual", name: "Lead qualification", desc: "Ask the right questions and prioritize serious buyers." },
      { key: "service_booking", name: "Service booking", desc: "Schedule service appointments and confirm requirements." },
      { key: "exchange", name: "Exchange and valuation", desc: "Collect vehicle details and route for valuation." }
    ]
  },
  {
    key: "telecom",
    name: "Telecom",
    outcome: "Resolve billing, plan changes, and network support efficiently.",
    useCases: [
      { key: "plan_change", name: "Plan changes", desc: "Recommend plans based on needs and complete requests." },
      { key: "billing", name: "Billing queries", desc: "Explain bills, due amounts, and payment options." },
      { key: "support", name: "Network support triage", desc: "Identify issues quickly and guide next steps." },
      { key: "retention", name: "Retention and save", desc: "Detect churn signals and offer next best actions." }
    ]
  },
  {
    key: "healthcare",
    name: "Healthcare",
    outcome: "Triage, scheduling, and patient support without long waits.",
    useCases: [
      { key: "appointment", name: "Appointment scheduling", desc: "Book, reschedule, and confirm appointments." },
      { key: "triage", name: "Symptom triage", desc: "Basic screening and routing to the right care path." },
      { key: "followups", name: "Follow-ups and reminders", desc: "Medication, lab, and visit reminders." },
      { key: "billing", name: "Billing support", desc: "Answer billing questions and payment guidance." }
    ]
  },
  {
    key: "bpo",
    name: "BPO",
    outcome: "Scale customer operations with consistent quality and compliance.",
    useCases: [
      { key: "faq_deflect", name: "FAQ deflection", desc: "Reduce live load with accurate automation." },
      { key: "collections", name: "Collections outreach", desc: "Automated calling with compliant scripting." },
      { key: "qa", name: "Automated QA signals", desc: "Flag risks and coaching opportunities." },
      { key: "handoff", name: "Human handoff", desc: "Transfer with context and intent preserved." }
    ]
  },
  {
    key: "real_estate",
    name: "Real Estate",
    outcome: "Qualify leads, schedule site visits, and keep pipeline warm.",
    useCases: [
      { key: "lead_qual", name: "Lead qualification", desc: "Budget, location, timeline, and intent capture." },
      { key: "site_visit", name: "Site visit scheduling", desc: "Book visits, confirm preferences, send reminders." },
      { key: "followups", name: "Follow-ups", desc: "Nurture leads with relevant updates." },
      { key: "documents", name: "Document collection", desc: "Collect requirements and guide next steps." }
    ]
  }
];

const state = {
  step: 1,
  industry: null,
  useCase: null,
  phone: "",
  lastRequestId: null
};

const elScreen = document.getElementById("screen");
const resetBtn = document.getElementById("resetBtn");
const footerHint = document.getElementById("footerHint");

resetBtn.addEventListener("click", () => resetFlow());

function setStepper(step){
  const s1 = document.getElementById("step-1");
  const s2 = document.getElementById("step-2");
  const s3 = document.getElementById("step-3");

  s1.className = "step";
  s2.className = "step";
  s3.className = "step";

  if(step === 1){
    s1.classList.add("active");
  } else if(step === 2){
    s1.classList.add("done");
    s2.classList.add("active");
  } else if(step === 3){
    s1.classList.add("done");
    s2.classList.add("done");
    s3.classList.add("active");
  } else if(step === 4){
    s1.classList.add("done");
    s2.classList.add("done");
    s3.classList.add("done");
  }
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetFlow(){
  state.step = 1;
  state.industry = null;
  state.useCase = null;
  state.phone = "";
  state.lastRequestId = null;
  render();
}

function render(){
  if(state.step === 1) renderIndustry();
  if(state.step === 2) renderUseCase();
  if(state.step === 3) renderPhone();
  if(state.step === 4) renderConnecting();
  if(state.step === 5) renderPostCall();
}

function renderIndustry(){
  setStepper(1);
  footerHint.textContent = "Pick one industry to tailor the live AI workflow.";

  const tiles = INDUSTRIES.map(ind => {
    return `
      <div class="tile" role="button" tabindex="0" data-industry="${escapeHtml(ind.key)}">
        <div class="tile-title">${escapeHtml(ind.name)}</div>
        <div class="tile-sub">${escapeHtml(ind.outcome)}</div>
      </div>
    `;
  }).join("");

  elScreen.innerHTML = `
    <div class="h2">Choose your industry</div>
    <div class="hint">This configures the live AI agent to your workflow.</div>
    <div class="grid">${tiles}</div>
  `;

  elScreen.querySelectorAll(".tile").forEach(tile => {
    tile.addEventListener("click", () => {
      const key = tile.getAttribute("data-industry");
      state.industry = INDUSTRIES.find(x => x.key === key);
      state.step = 2;
      render();
    });
    tile.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        tile.click();
      }
    });
  });
}

function renderUseCase(){
  setStepper(2);
  footerHint.textContent = "Choose one use case. Then you will receive a live AI call.";

  const ind = state.industry;
  if(!ind){ resetFlow(); return; }

  const tiles = ind.useCases.map(uc => {
    return `
      <div class="tile" role="button" tabindex="0" data-uc="${escapeHtml(uc.key)}">
        <div class="tile-title">${escapeHtml(uc.name)}</div>
        <div class="tile-sub">${escapeHtml(uc.desc)}</div>
      </div>
    `;
  }).join("");

  elScreen.innerHTML = `
    <div class="row" style="margin-bottom:10px">
      <div class="pill">${escapeHtml(ind.name)}</div>
      <div class="small muted">Step two of three</div>
    </div>
    <div class="h2">Select a live use case</div>
    <div class="hint">We will run a short scenario. Two to three minutes.</div>
    <div class="grid">${tiles}</div>
  `;

  elScreen.querySelectorAll(".tile").forEach(tile => {
    tile.addEventListener("click", () => {
      const key = tile.getAttribute("data-uc");
      state.useCase = ind.useCases.find(x => x.key === key);
      state.step = 3;
      render();
    });
    tile.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        tile.click();
      }
    });
  });
}

function normalizePhone(input){
  let p = String(input || "").trim();
  // allow + and digits only, remove spaces, hyphens, brackets
  p = p.replace(/[\s\-\(\)\.]/g, "");
  // keep leading + if present
  p = p.replace(/(?!^)\+/g, "");
  return p;
}

function isValidPhone(p){
  // Minimal E.164 style validation: + optional, 8 to 15 digits
  const x = normalizePhone(p);
  const digits = x.startsWith("+") ? x.slice(1) : x;
  if(!/^\d+$/.test(digits)) return false;
  if(digits.length < 8 || digits.length > 15) return false;
  if(x.startsWith("+") && digits.length < 8) return false;
  return true;
}

function renderPhone(){
  setStepper(3);
  footerHint.textContent = "Enter your phone number. You will receive a live AI call instantly.";

  const ind = state.industry;
  const uc = state.useCase;
  if(!ind || !uc){ resetFlow(); return; }

  elScreen.innerHTML = `
    <div class="row" style="margin-bottom:10px">
      <div class="pill">${escapeHtml(ind.name)}</div>
      <div class="pill">${escapeHtml(uc.name)}</div>
    </div>

    <div class="h2">Get a live AI call now</div>
    <div class="hint">You will hear a Gnani AI agent demonstrate this workflow in real time.</div>

    <label class="small muted" for="phone">Phone number</label>
    <input id="phone" class="input" placeholder="+91XXXXXXXXXX" inputmode="tel" autocomplete="tel" maxlength="${CONFIG.maxPhoneLen}" />

    <div class="row" style="margin-top:10px">
      <button class="btn" id="callBtn" type="button" disabled>Call me now</button>
    </div>

    <div class="alert warn" id="trustBox">Instant call. No spam. No sales pitch.</div>
    <div class="small muted" style="margin-top:8px">If your call does not connect, you can retry immediately.</div>
  `;

  const input = document.getElementById("phone");
  const btn = document.getElementById("callBtn");

  input.value = state.phone;
  btn.disabled = !isValidPhone(input.value);

  input.addEventListener("input", () => {
    state.phone = input.value;
    btn.disabled = !isValidPhone(input.value);
  });

  btn.addEventListener("click", async () => {
    const phone = normalizePhone(input.value);
    if(!isValidPhone(phone)){
      btn.disabled = true;
      return;
    }
    state.phone = phone;
    state.step = 4;
    render();

    try{
      const res = await fetch(`${CONFIG.apiBase}/api/start-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industryKey: ind.key,
          industryName: ind.name,
          useCaseKey: uc.key,
          useCaseName: uc.name,
          phone
        })
      });

      const data = await res.json().catch(() => ({}));

      if(!res.ok){
        const msg = data && data.error ? data.error : "Call could not be started. Please try again.";
        renderConnecting({ status: "error", message: msg });
        return;
      }

      state.lastRequestId = data.requestId || null;
      renderConnecting({
        status: "ok",
        message: "Call request created. You should receive a call shortly."
      });

      // Transition to post-call screen after a short delay so user sees feedback.
      setTimeout(() => {
        state.step = 5;
        render();
      }, 1400);

    } catch(err){
      renderConnecting({ status: "error", message: "Network error. Please retry." });
    }
  });
}

function renderConnecting(override){
  setStepper(4);
  const ind = state.industry;
  const uc = state.useCase;

  const status = override && override.status ? override.status : "loading";
  const message = override && override.message ? override.message : "Connecting you to a Gnani AI agent...";

  let alertClass = "warn";
  let icon = `<span class="spinner"></span>`;

  if(status === "ok"){
    alertClass = "ok";
    icon = "";
  }
  if(status === "error"){
    alertClass = "bad";
    icon = "";
  }

  elScreen.innerHTML = `
    <div class="row" style="margin-bottom:10px">
      <div class="pill">${escapeHtml(ind ? ind.name : "")}</div>
      <div class="pill">${escapeHtml(uc ? uc.name : "")}</div>
    </div>

    <div class="h2">Calling you now</div>
    <div class="hint">Answer the call to experience the live AI workflow.</div>

    <div class="alert ${alertClass}">${icon}${escapeHtml(message)}</div>

    <div class="kpiRow">
      <div class="kpi">
        <div class="t">Industry</div>
        <div class="v">${escapeHtml(ind ? ind.name : "")}</div>
      </div>
      <div class="kpi">
        <div class="t">Use case</div>
        <div class="v">${escapeHtml(uc ? uc.name : "")}</div>
      </div>
    </div>

    <div class="row" style="margin-top:12px">
      <button class="ghost" id="retryBtn" type="button">Retry</button>
    </div>
  `;

  document.getElementById("retryBtn").addEventListener("click", () => {
    state.step = 3;
    render();
  });

  footerHint.textContent = "If you do not receive a call, retry. Abuse prevention may block repeated attempts.";
}

function renderPostCall(){
  setStepper(4);
  footerHint.textContent = "Next actions: book a tailored demo or explore industry results.";

  const ind = state.industry;
  const uc = state.useCase;

  // Replace these with your actual URLs
  const bookDemoUrl = "https://www.gnani.ai/book-demo";
  const industryResultsUrl = "https://www.gnani.ai/case-studies";

  elScreen.innerHTML = `
    <div class="h2">You just experienced a live Agentic AI workflow.</div>
    <div class="hint">This is how enterprises deploy Gnani AI in production environments.</div>

    <div class="row" style="margin-bottom:10px">
      <div class="pill">${escapeHtml(ind ? ind.name : "")}</div>
      <div class="pill">${escapeHtml(uc ? uc.name : "")}</div>
    </div>

    <div class="row" style="gap:10px; margin-top:10px">
      <a class="btn" href="${escapeHtml(bookDemoUrl)}" target="_blank" rel="noopener noreferrer">Book a tailored demo</a>
      <a class="ghost" href="${escapeHtml(industryResultsUrl)}" target="_blank" rel="noopener noreferrer">See industry results</a>
    </div>

    <div class="row" style="margin-top:12px">
      <button class="ghost" id="tryAnotherBtn" type="button">Try another use case</button>
    </div>

    <div class="small muted" style="margin-top:10px">
      Reference: ${escapeHtml(state.lastRequestId || "Not available")}
    </div>
  `;

  document.getElementById("tryAnotherBtn").addEventListener("click", () => {
    state.step = 2;
    render();
  });
}

render();
