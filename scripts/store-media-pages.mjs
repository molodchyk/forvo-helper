function pageShell(title, body, extraCss = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${baseCss()}
${extraCss}
</style>
</head>
<body>${body}</body>
</html>`;
}

function baseCss() {
  return `
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; }
body {
  background: #f6f8fb;
  color: #172033;
  font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  letter-spacing: 0;
}
.brand { display: inline-flex; align-items: center; gap: 14px; font-weight: 760; }
.logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 850;
}
.muted { color: #607086; }
.accent { color: #2563eb; }
.green { color: #157a4d; }
.panel {
  background: #fff;
  border: 1px solid #d7e0ec;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(31, 42, 61, 0.10);
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 7px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #172033;
  font-weight: 600;
}
.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.recorder {
  position: relative;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, #e96a76 0 27%, #f8e9ed 28% 40%, transparent 41%),
    repeating-radial-gradient(circle at center, rgba(37, 99, 235, .16) 0 2px, transparent 2px 26px);
  border: 3px solid rgba(37, 99, 235, .22);
}
.recorder::before {
  content: "";
  position: absolute;
  inset: 40px;
  border-radius: 50%;
  border: 2px solid rgba(37, 99, 235, .22);
}
.recorder::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 68px;
  height: 68px;
  transform: translate(-50%, -44%);
  background: center / contain no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='68' height='68' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.35' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'/%3E%3Cpath d='M19 10v2a7 7 0 0 1-14 0v-2'/%3E%3Cline x1='12' y1='19' x2='12' y2='22'/%3E%3Cline x1='8' y1='22' x2='16' y2='22'/%3E%3C/svg%3E");
}
`;
}

export function workflowScreenshotHtml() {
  return pageShell("Forvo workflow", `
<main class="workflow">
  <header class="topbar">
    <div class="brand"><div class="logo">Fh</div><span>Forvo Helper</span></div>
    <nav><span>Forvo</span><span>Goroh</span><span>ChatGPT fallback</span></nav>
  </header>
  <section class="hero">
    <div class="forvo panel">
      <h1>Pronounce</h1>
      <div class="word-card">
        <div class="muted">You are pronouncing:</div>
        <strong>чемненький</strong>
        <span>Ukrainian [uk]</span>
      </div>
      <div class="stress-card">
        <span>Goroh</span>
        <strong>чемне́нький</strong>
        <a>Open</a>
      </div>
      <div class="record-card">
        <div class="play">▶</div>
        <div>
          <div class="recorder"></div>
          <p>Press to record</p>
        </div>
        <div class="tip">Stress checked before recording.</div>
      </div>
      <button class="submit">Send pronunciation</button>
    </div>
    <aside class="side panel">
      <h2>Record without the mouse</h2>
      <ul>
        <li>Keyboard command</li>
        <li>Hover delay</li>
        <li>Circle gesture</li>
      </ul>
      <div class="stat">
        <span>Today</span>
        <strong>12 submitted</strong>
      </div>
    </aside>
  </section>
</main>`, `
.workflow { width: 1280px; height: 800px; overflow: hidden; }
.topbar {
  height: 88px;
  padding: 0 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #d7e0ec;
}
.topbar .brand { font-size: 26px; }
.topbar nav { display: flex; gap: 28px; color: #607086; font-weight: 600; }
.hero { display: grid; grid-template-columns: 1fr 330px; gap: 34px; padding: 30px 70px; }
.forvo { min-height: 620px; padding: 24px 42px; }
.forvo h1 { margin: 0 0 18px; font-size: 34px; }
.word-card { text-align: center; background: #f1f5f9; padding: 16px; border-radius: 4px; }
.word-card strong { display: block; margin-top: 4px; font-size: 42px; line-height: 1.05; }
.word-card span { font-weight: 700; }
.stress-card {
  margin: 16px 0 22px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  border: 1px solid #9ad6b3;
  border-radius: 8px;
  background: #eaf8f0;
}
.stress-card span { color: #167a4d; font-weight: 700; }
.stress-card strong { font-size: 28px; font-weight: 650; }
.stress-card a { color: #2563eb; font-weight: 700; }
.record-card {
  height: 245px;
  display: grid;
  grid-template-columns: 160px 260px 1fr;
  align-items: center;
  justify-items: center;
  border: 1px solid #e1e7ef;
  border-radius: 4px;
}
.record-card .recorder { transform: scale(.88); }
.record-card p { margin: -6px 0 0; text-align: center; font-size: 20px; font-family: Georgia, serif; }
.play { color: #cfd8e5; font-size: 82px; }
.tip { color: #cc194f; max-width: 190px; font-weight: 700; line-height: 1.45; }
.submit {
  display: block;
  width: 380px;
  margin: 18px auto 0;
  border: 0;
  border-radius: 80px;
  background: #0500ff;
  color: #fff;
  font-size: 22px;
  padding: 17px;
}
.side { padding: 34px 32px; }
.side h2 { margin: 0 0 18px; font-size: 30px; line-height: 1.15; }
.side ul { margin: 0; padding-left: 22px; color: #42526a; line-height: 2; font-size: 19px; }
.stat { margin-top: 42px; padding: 18px; border-radius: 8px; background: #f0f7ff; border: 1px solid #bfdbfe; }
.stat span { color: #607086; }
.stat strong { display: block; margin-top: 4px; font-size: 26px; }
`);
}

export function optionsScreenshotHtml() {
  return pageShell("Forvo Helper options", `
<main class="options">
  <header>
    <div>
      <div class="eyebrow">Options</div>
      <h1>Forvo Helper</h1>
    </div>
    <button class="button">Reset settings</button>
  </header>
  <section class="grid">
    <div class="panel card">
      <h2>Recording</h2>
      ${check("Start recording after hovering over the record button", true)}
      ${field("Hover delay in seconds", "0.90")}
      ${check("Start recording after circling the record button", false)}
      ${check("Use a page hotkey while Forvo is focused", true)}
      ${field("Page hotkey", "Alt+Shift+R")}
    </div>
    <div class="panel card">
      <h2>Lookup</h2>
      ${check("Open Goroh when a Forvo word is detected", true)}
      ${field("Goroh lookup mode", "Direct result URL")}
      ${check("Open ChatGPT when Goroh has no stress mark", true)}
      ${check("Open ChatGPT when a Forvo page opens", true)}
      ${field("ChatGPT target chat URL", "https://chatgpt.com/c/...")}
      ${check("Skip duplicate ChatGPT prompts", true)}
    </div>
    <div class="panel card wide">
      <h2>Appearance and status</h2>
      ${field("Theme", "System")}
      ${check("Show today's submitted count on the toolbar badge", true)}
      <div class="prompt">Find the Ukrainian stress for "{word}". Reply with the word marked with an acute accent.</div>
    </div>
  </section>
</main>`, `
.options { width: 1280px; height: 800px; padding: 54px 86px; }
header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.eyebrow { color: #2563eb; font-weight: 800; text-transform: uppercase; font-size: 13px; }
h1 { margin: 4px 0 0; font-size: 42px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
.card { padding: 26px; display: grid; gap: 17px; }
.card h2 { margin: 0 0 3px; font-size: 24px; }
.wide { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; align-items: start; }
.wide h2 { grid-column: 1 / -1; }
.row { display: grid; grid-template-columns: 24px 1fr; gap: 12px; align-items: center; font-size: 17px; }
.box { width: 20px; height: 20px; border-radius: 4px; border: 1px solid #9fb0c5; background: #fff; }
.box.on { background: #2563eb; border-color: #2563eb; position: relative; }
.box.on::after { content: "✓"; color: #fff; position: absolute; inset: -3px 0 0 3px; font-weight: 900; }
.field { display: grid; grid-template-columns: 210px 1fr; gap: 18px; align-items: center; font-size: 17px; }
.control { border: 1px solid #cbd5e1; border-radius: 7px; padding: 11px 13px; background: #f8fafc; color: #172033; }
.prompt { grid-column: 1 / -1; min-height: 92px; border: 1px solid #cbd5e1; border-radius: 7px; padding: 16px; color: #42526a; background: #f8fafc; }
`);
}

export function popupScreenshotHtml() {
  return pageShell("Forvo Helper popup", `
<main class="popup-shot">
  <section class="browser">
    <div class="bar"><span></span><span></span><span></span><div>forvo.com/word-record/чемненький/uk/</div></div>
    <div class="page-mini">
      <div class="brand"><div class="logo">Fh</div><span>Forvo Helper</span></div>
      <div class="word">чемненький</div>
      <div class="stress"><span>Goroh</span><strong>чемне́нький</strong></div>
      <div class="recorder"></div>
    </div>
  </section>
  <section class="popup panel">
    <header><h1>Forvo Helper</h1><button>⚙</button></header>
    <dl>
      <dt>Current word</dt><dd>чемненький</dd>
      <dt>Stress</dt><dd>Found on Goroh</dd>
      <dt>Today</dt><dd>12 submitted</dd>
    </dl>
    <div class="total">
      <span>Forvo total</span>
      <strong>65 pronounced</strong>
      <small>molodchyk - updated today</small>
    </div>
    <button class="button primary">Refresh total</button>
  </section>
</main>`, `
.popup-shot { width: 1280px; height: 800px; padding: 76px; display: grid; grid-template-columns: 1fr 360px; gap: 36px; }
.browser { overflow: hidden; border-radius: 12px; background: #fff; border: 1px solid #d7e0ec; box-shadow: 0 18px 42px rgba(31,42,61,.10); }
.bar { height: 58px; background: #172033; display: flex; align-items: center; gap: 10px; padding: 0 18px; color: #cbd5e1; }
.bar span { width: 12px; height: 12px; border-radius: 50%; background: #64748b; }
.bar div { margin-left: 18px; background: #243149; border-radius: 8px; padding: 9px 16px; width: 520px; }
.page-mini { height: 590px; padding: 48px 64px; }
.page-mini .brand { font-size: 28px; margin-bottom: 50px; }
.word { text-align: center; font-size: 52px; font-weight: 850; margin-bottom: 24px; }
.stress { margin: 0 auto 42px; width: 620px; border-radius: 8px; background: #eaf8f0; border: 1px solid #9ad6b3; padding: 16px; display: flex; justify-content: center; gap: 24px; align-items: center; }
.stress span { color: #157a4d; font-weight: 700; }
.stress strong { font-size: 25px; }
.page-mini .recorder { margin: 0 auto; }
.popup { padding: 20px; align-self: start; }
.popup header { display: flex; justify-content: space-between; align-items: center; }
.popup h1 { margin: 0; font-size: 22px; }
.popup header button { width: 38px; height: 38px; border-radius: 7px; border: 1px solid #cbd5e1; background: #fff; }
dl { display: grid; gap: 5px; margin: 24px 0; }
dt { color: #607086; font-size: 13px; }
dd { margin: 0 0 12px; font-size: 20px; font-weight: 750; }
.total { border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; padding: 16px; display: grid; gap: 4px; }
.total span, .total small { color: #607086; }
.total strong { font-size: 24px; }
.popup .button { width: 100%; margin-top: 16px; }
`);
}

export function smallPromoHtml() {
  return pageShell("Small promo", `
<main class="small-promo">
  <div>
    <div class="brand"><div class="logo">Fh</div><span>Forvo Helper</span></div>
    <h1>Record faster.<br>Check stress first.</h1>
    <p>Keyboard, hover, and Goroh lookup for Forvo contributors.</p>
  </div>
  <div class="mini-recorder"><div class="recorder"></div></div>
</main>`, `
.small-promo { width: 440px; height: 280px; padding: 26px 28px; display: grid; grid-template-columns: 1fr 135px; gap: 18px; background: #f6f8fb; overflow: hidden; }
.brand { font-size: 18px; gap: 9px; }
.logo { width: 32px; height: 32px; border-radius: 8px; font-size: 13px; }
h1 { margin: 28px 0 10px; font-size: 27px; line-height: 1.08; }
p { margin: 0; color: #607086; font-size: 14px; line-height: 1.42; }
.mini-recorder { align-self: center; justify-self: end; width: 130px; height: 130px; display: grid; place-items: center; }
.mini-recorder .recorder { width: 130px; height: 130px; transform: none; }
.mini-recorder .recorder::before { inset: 22px; }
.mini-recorder .recorder::after { width: 38px; height: 38px; }
`);
}

export function marqueePromoHtml() {
  return pageShell("Marquee promo", `
<main class="marquee">
  <section>
    <div class="brand"><div class="logo">Fh</div><span>Forvo Helper</span></div>
    <h1>Record Forvo pronunciations without repeated mouse clicks</h1>
    <p>Start recording by hotkey, hover, or circle gesture. Check Ukrainian stress through Goroh and use a configured ChatGPT chat only when fallback is needed.</p>
    <div class="badges"><span>Forvo</span><span>Goroh</span><span>ChatGPT fallback</span></div>
  </section>
  <aside class="panel preview">
    <div class="word">чемненький</div>
    <div class="stress"><span>Goroh</span><strong>чемне́нький</strong></div>
    <div class="recorder"></div>
    <button class="button primary">Start recording</button>
  </aside>
</main>`, `
.marquee { width: 1400px; height: 560px; padding: 70px 92px; display: grid; grid-template-columns: 1fr 430px; gap: 80px; background: linear-gradient(135deg, #f6f8fb 0%, #eef6f3 100%); overflow: hidden; }
.brand { font-size: 28px; }
h1 { margin: 44px 0 20px; font-size: 56px; line-height: 1.04; max-width: 770px; letter-spacing: 0; }
p { margin: 0; max-width: 740px; color: #42526a; font-size: 22px; line-height: 1.45; }
.badges { display: flex; gap: 14px; margin-top: 34px; }
.badges span { padding: 10px 16px; border-radius: 999px; border: 1px solid #cbd5e1; background: rgba(255,255,255,.8); font-weight: 700; color: #42526a; }
.preview { padding: 32px; display: grid; justify-items: center; align-content: center; gap: 20px; }
.word { font-size: 36px; font-weight: 850; }
.stress { width: 100%; border-radius: 8px; background: #eaf8f0; border: 1px solid #9ad6b3; padding: 13px 16px; display: flex; justify-content: center; gap: 20px; }
.stress span { color: #157a4d; font-weight: 700; }
.recorder { transform: scale(.78); }
.button { width: 240px; }
`);
}

function check(label, checked) {
  return `<div class="row"><span class="box ${checked ? "on" : ""}"></span><span>${label}</span></div>`;
}

function field(label, value) {
  return `<div class="field"><span>${label}</span><span class="control">${value}</span></div>`;
}
