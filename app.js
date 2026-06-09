// ─── SCHEMA ───────────────────────────────────────────────────────────────────
const CORNERS = [
  ["A", "O", "L"],
  ["B", "H", "K"],
  ["C", "G", "D"],
  ["N", "I", "T"],
  ["S", "E", "J"],
  ["M", "R", "U"],
  ["W", "P", "F"],
];
const EDGES = [
  ["A", "E"],
  ["B", "P"],
  ["C", "L"],
  ["D", "R"],
  ["H", "F"],
  ["G", "T"],
  ["K", "I"],
  ["M", "O"],
  ["N", "W"],
  ["Z", "S"],
  ["U", "J"],
];

const CORNER_WEIGHTS = [
  { value: 3, weight: 47 },
  { value: 4, weight: 48 },
  { value: 5, weight: 5 },
];
const EDGE_WEIGHTS = [
  { value: 4, weight: 20 },
  { value: 5, weight: 40 },
  { value: 6, weight: 35 },
  { value: 7, weight: 5 },
];

function weightedRandom(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// FIX: blokuje tylko litery z odpowiedniego schematu (corners LUB edges)
function getBlockedLetters(pair, schema) {
  const blocked = new Set(pair);
  for (const letter of pair) {
    for (const group of schema) {
      if (group.includes(letter)) group.forEach((l) => blocked.add(l));
    }
  }
  return blocked;
}

function generatePairsForType(type, count, useBlocking = false) {
  const schema = type === "corners" ? CORNERS : EDGES;
  const pairs = [];
  const pieceState = new Map(
    schema.map((g) => [g.join(""), { usedLetter: null, uses: 0 }]),
  );
  let blocked = new Set();

  const getAvailable = () => {
    const out = [];
    for (const group of schema) {
      const key = group.join("");
      const ps = pieceState.get(key);
      if (ps.uses === 0) {
        group.forEach((l) => { if (!blocked.has(l)) out.push({ letter: l, pieceKey: key }); });
      } else if (ps.uses === 1) {
        if (!blocked.has(ps.usedLetter)) out.push({ letter: ps.usedLetter, pieceKey: key });
      }
    }
    return out;
  };

  let attempts = 0;
  while (pairs.length < count && attempts < 1000) {
    attempts++;
    const avail = shuffle(getAvailable());
    if (avail.length < 2) break;
    const first = avail[0];
    const second = avail.find((x) => x.pieceKey !== first.pieceKey);
    if (!second) break;
    const pairKey = [first.letter, second.letter].sort().join("-");
    if (pairs.some(([a, b]) => [a, b].sort().join("-") === pairKey)) continue;
    pairs.push([first.letter, second.letter]);
    [first, second].forEach(({ letter, pieceKey }) => {
      const ps = pieceState.get(pieceKey);
      if (ps.uses === 0) ps.usedLetter = letter;
      ps.uses++;
    });
    // FIX: przekazujemy schema zamiast [...CORNERS, ...EDGES]
    if (useBlocking) {
      const newBlocked = getBlockedLetters([first.letter, second.letter], schema);
      newBlocked.forEach(l => blocked.add(l));
    }
  }
  return pairs;
}

function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;
  const useCornerBlocking = cornerCount === "?";
  const useEdgeBlocking = edgeCount === "?";

  const cornerPairs =
    mode === "corners" || mode === "mixed"
      ? generatePairsForType("corners", cc, useCornerBlocking)
      : [];

  let cornerSingiel = null;
  if (
    (mode === "corners" || mode === "mixed") &&
    cornerCount === "?" &&
    cc !== 5 &&
    Math.random() < 0.5
  ) {
    const usedLetters = new Set(cornerPairs.flat());
    const unusedPieces = CORNERS.filter((g) =>
      g.every((l) => !usedLetters.has(l)),
    );
    if (unusedPieces.length > 0) {
      const piece = unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
      cornerSingiel = piece[Math.floor(Math.random() * piece.length)];
    }
  }

  const edgePairs =
    mode === "edges" || mode === "mixed"
      ? generatePairsForType("edges", ec, useEdgeBlocking)
      : [];

  const cornerItems = [
    ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
    ...(cornerSingiel ? [{ pair: [cornerSingiel], type: "corner-single" }] : []),
  ];

  return {
    displayPairs: [
      ...cornerItems,
      ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
    ],
    answerPairs: [
      ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
      ...cornerItems,
    ],
  };
}

// ─── STATE ────────────────────────────────────────────────────────────────────
function loadConfig() {
  try {
    const raw = localStorage.getItem("bld-config");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveConfig() {
  localStorage.setItem(
    "bld-config",
    JSON.stringify({
      mode: state.mode,
      cornerCount: state.cornerCount,
      edgeCount: state.edgeCount,
    }),
  );
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("bld-history") || "[]");
  } catch {
    return [];
  }
}

function saveToHistory() {
  if (state.sessionSaved) return;
  state.sessionSaved = true;
  const ap = state.session.answerPairs;
  let correct = 0;
  let skipped = 0;
  ap.forEach(({ pair }, i) => {
    if (state.skipped[i]) { skipped++; return; }
    const ans = state.answers[i];
    const ok =
      pair.length === 1
        ? ans[0] === pair[0]
        : (ans[0] === pair[0] && ans[1] === pair[1]) ||
          (ans[0] === pair[1] && ans[1] === pair[0]);
    if (ok) correct++;
  });
  const entry = {
    ts: Date.now(),
    mode: state.mode,
    total: ap.length,
    correct,
    skipped,
    time: state.memTime,
  };
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem("bld-history", JSON.stringify(history.slice(0, 200)));
}

const _saved = loadConfig();
const state = {
  phase: "config",
  mode: _saved.mode ?? "mixed",
  cornerCount: _saved.cornerCount ?? "?",
  edgeCount: _saved.edgeCount ?? "?",
  session: null,
  memTime: 0,
  answers: [],
  skipped: [],
  timerInterval: null,
  sessionSaved: false,
};

function fmt(s) {
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById("app");
  if (state.phase === "config") app.innerHTML = renderConfig();
  else if (state.phase === "memorize") app.innerHTML = renderMemorize();
  else if (state.phase === "answer") app.innerHTML = renderAnswer();
  else if (state.phase === "result") app.innerHTML = renderResult();
  else if (state.phase === "history") app.innerHTML = renderHistory();
  bindEvents();
}

// CONFIG
function renderConfig() {
  const showCorners = state.mode === "corners" || state.mode === "mixed";
  const showEdges = state.mode === "edges" || state.mode === "mixed";

  const modeBtn = (id, label, sub) =>
    `<button class="mode-btn${state.mode === id ? " active" : ""}" data-mode="${id}">
      <span class="mode-label">${label}</span>
      <span class="mode-sub">${sub}</span>
    </button>`;

  const countBtn = (val, current, type) =>
    `<button class="count-btn${current === val ? " active" : ""}" data-count="${val}" data-type="${type}">${val}</button>`;

  return `<div class="screen"><div class="card">
    <div class="logo">BLD<span class="accent">pairs</span></div>
    <p class="sub">Trening par liter — blind solving</p>
    <div class="field-label">Tryb treningu</div>
    <div class="mode-grid">
      ${modeBtn("corners", "Rogi", "tylko rogi")}
      ${modeBtn("edges", "Krawędzie", "tylko krawędzie")}
      ${modeBtn("mixed", "Mieszany", "rogi + krawędzie")}
    </div>
    ${showCorners ? `
    <div class="field-label">Liczba par — rogi</div>
    <div class="count-row">
      ${[3, 4, 5, "?"].map((n) => countBtn(n, state.cornerCount, "corner")).join("")}
    </div>` : ""}
    ${showEdges ? `
    <div class="field-label">Liczba par — krawędzie</div>
    <div class="count-row">
      ${[4, 5, 6, 7, "?"].map((n) => countBtn(n, state.edgeCount, "edge")).join("")}
    </div>` : ""}
    <button class="btn-primary" id="btn-start">Losuj i zapamiętaj →</button>
    <button class="btn-history" id="btn-history">Historia</button>
  </div></div>`;
}

// MEMORIZE
function renderMemorize() {
  const corners = state.session.displayPairs.filter(
    (p) => p.type === "corner" || p.type === "corner-single",
  );
  const edges = state.session.displayPairs.filter((p) => p.type === "edge");
  const chips = (arr, cls) =>
    arr.map((p) =>
      p.pair.length === 1
        ? `<div class="pair-chip ${cls} singiel-chip"><span class="ltr">${p.pair[0]}</span></div>`
        : `<div class="pair-chip ${cls}">
      <span class="ltr">${p.pair[0]}</span>
      <span class="dash">–</span>
      <span class="ltr">${p.pair[1]}</span>
    </div>`
    ).join("");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <span class="phase-title">Zapamiętaj</span>
      <span class="timer" id="timer-display">${fmt(state.memTime)}</span>
    </div>
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="pairs-wrap">${chips(corners, "corner-chip")}</div>` : ""}
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="pairs-wrap">${chips(edges, "edge-chip")}</div>` : ""}
    <button class="btn-stop" id="btn-stop">■ STOP — przejdź do odpowiedzi</button>
  </div></div>`;
}

// ANSWER
function renderAnswer() {
  const ap = state.session.answerPairs;
  const edges = ap.filter((p) => p.type === "edge");
  const corners = ap.filter((p) => p.type === "corner" || p.type === "corner-single");
  const edgeOffset = 0;
  const cornerOffset = edges.length;

  const rowHtml = (row, i) => {
    const sk = state.skipped[row];
    const isSingle = ap[row].pair.length === 1;
    return `<div class="answer-row${sk ? " skipped" : ""}" data-row="${row}">
      ${sk
        ? `<span class="skip-label">— pominięto</span>`
        : isSingle
          ? `<input class="li" id="inp-${row}-0" value="${state.answers[row]?.[0] || ""}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">
             <span class="singiel-label">si</span>
             <button class="btn-skip-text" data-skip="${row}">Pomiń</button>`
          : `<input class="li" id="inp-${row}-0" value="${state.answers[row]?.[0] || ""}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">
           <span class="dash">–</span>
           <input class="li" id="inp-${row}-1" value="${state.answers[row]?.[1] || ""}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">
           <button class="btn-skip-text" data-skip="${row}">Pomiń</button>`
      }
    </div>`;
  };

  const allDone = state.answers.every(
    (ans, i) => state.skipped[i] || ans.every((v) => v),
  );

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <span class="phase-title">Wpisz z pamięci</span>
      <span class="muted-t">⏱ ${fmt(state.memTime)}</span>
    </div>
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="answer-list">${edges.map((_, i) => rowHtml(edgeOffset + i, i)).join("")}</div>` : ""}
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="answer-list">${corners.map((_, i) => rowHtml(cornerOffset + i, i)).join("")}</div>` : ""}
    <button class="btn-primary" id="btn-check" ${allDone ? "" : "disabled"}>Sprawdź →</button>
  </div></div>`;
}

// RESULT
function renderResult() {
  const ap = state.session.answerPairs;
  const results = ap.map(({ pair, type }, i) => {
    if (state.skipped[i]) return { status: "skipped", pair, given: ["", ""], type };
    const ans = state.answers[i];
    const correct =
      pair.length === 1
        ? ans[0] === pair[0]
        : (ans[0] === pair[0] && ans[1] === pair[1]) ||
          (ans[0] === pair[1] && ans[1] === pair[0]);
    return { status: correct ? "ok" : "fail", pair, given: ans, type };
  });

  const score = results.filter((r) => r.status === "ok").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const pct = Math.round((score / results.length) * 100);

  const resRow = ({ status, pair, given }, i) =>
    `<div class="res-row ${status}">
      <span class="exp">${pair.length === 1 ? pair[0] : `${pair[0]}–${pair[1]}`}</span>
      ${status === "fail" ? `<span class="got">wpisałeś: ${given[0] || "?"}${pair.length === 2 ? given[1] || "?" : ""}</span>` : ""}
      ${status === "skipped" ? `<span class="got">pominięto</span>` : ""}
      <span class="icon">${status === "ok" ? "✓" : status === "skipped" ? "—" : "✗"}</span>
    </div>`;

  const edges = results.filter((r) => r.type === "edge");
  const corners = results.filter((r) => r.type === "corner" || r.type === "corner-single");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-config">⚙</button>
      <span class="phase-title">Wynik</span>
      <span class="score-inline">${score}/${results.length} · ${pct}%</span>
    </div>
    ${skippedCount > 0 ? `<div class="skip-note">pominięto: ${skippedCount}</div>` : ""}
    <div class="mem-line">czas zapamiętywania: ${fmt(state.memTime)}</div>
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div>${edges.map(resRow).join("")}` : ""}
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div>${corners.map(resRow).join("")}` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-retry">↺ Powtórz</button>
      <button class="btn-primary"   id="btn-new">Kolejna →</button>
    </div>
  </div></div>`;
}

// HISTORY
function renderHistory() {
  const history = loadHistory();
  const modeLabel = { corners: "Rogi", edges: "Krawędzie", mixed: "Mieszany" };

  const totalSessions = history.length;
  const totalPairs = history.reduce((s, e) => s + e.total, 0);
  const totalCorrect = history.reduce((s, e) => s + e.correct, 0);
  const perfectCount = history.filter(
    (e) => e.correct === e.total && e.skipped === 0,
  ).length;

  const pairPct = totalPairs ? Math.round((totalCorrect / totalPairs) * 100) : "—";
  const perfectPct = totalSessions ? Math.round((perfectCount / totalSessions) * 100) : "—";
  const failedPct = totalSessions ? Math.round(((totalSessions - perfectCount) / totalSessions) * 100) : "—";
  const avgTime = totalSessions
    ? fmt(Math.round(history.reduce((s, e) => s + e.time, 0) / totalSessions))
    : "—";
  const avgPct = totalSessions
    ? Math.round(history.reduce((s, e) => s + (e.correct / e.total) * 100, 0) / totalSessions) + "%"
    : "—";

  const fmtDate = (ts) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) +
      " " +
      d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const rows = history.slice(0, 50).map((e) => {
    const perfect = e.correct === e.total && e.skipped === 0;
    return `<div class="hist-row${perfect ? " hist-ok" : " hist-fail"}">
      <span class="hist-date">${fmtDate(e.ts)}</span>
      <span class="hist-mode">${modeLabel[e.mode] || e.mode}</span>
      <span class="hist-score">${e.correct}/${e.total}</span>
      <span class="hist-time">${fmt(e.time)}</span>
      <span class="hist-icon">${perfect ? "✓" : "✗"}</span>
    </div>`;
  }).join("");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <span class="phase-title">Historia</span>
      <button class="btn-config-top" id="btn-back">←</button>
    </div>
    <div class="hist-stats">
      <div class="hist-stat">
        <div class="hist-stat-val">${typeof pairPct === "number" ? pairPct + "%" : pairPct}</div>
        <div class="hist-stat-lbl">par poprawnie</div>
      </div>
      <div class="hist-stat hist-stat--ok">
        <div class="hist-stat-val">${typeof perfectPct === "number" ? perfectPct + "%" : perfectPct}</div>
        <div class="hist-stat-lbl">gier idealnych</div>
      </div>
      <div class="hist-stat hist-stat--fail">
        <div class="hist-stat-val">${typeof failedPct === "number" ? failedPct + "%" : failedPct}</div>
        <div class="hist-stat-lbl">gier nieudanych</div>
      </div>
    </div>
    <div class="hist-stats hist-stats--2col">
      <div class="hist-stat">
        <div class="hist-stat-val">${avgPct}</div>
        <div class="hist-stat-lbl">średni %</div>
      </div>
      <div class="hist-stat">
        <div class="hist-stat-val hist-stat-val--mono">${avgTime}</div>
        <div class="hist-stat-lbl">średni czas memo</div>
      </div>
    </div>
    <div class="hist-meta">${totalSessions} sesji · ${totalPairs} par łącznie</div>
    ${totalSessions === 0
      ? `<div class="hist-empty">Brak sesji. Zagraj pierwszą grę!</div>`
      : `<div class="hist-list">${rows}</div>`
    }
    ${totalSessions > 0 ? `<button class="btn-reset-history" id="btn-reset">Usuń historię</button>` : ""}
  </div></div>`;
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
function bindEvents() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      saveConfig();
      render();
    });
  });

  document.querySelectorAll(".count-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.count === "?" ? "?" : parseInt(btn.dataset.count);
      if (btn.dataset.type === "corner") state.cornerCount = val;
      else state.edgeCount = val;
      saveConfig();
      render();
    });
  });

  const btnStart = document.getElementById("btn-start");
  if (btnStart)
    btnStart.addEventListener("click", () => {
      state.session = generateSession(state.mode, state.cornerCount, state.edgeCount);
      state.memTime = 0;
      state.answers = state.session.answerPairs.map(({ pair }) =>
        pair.length === 1 ? [""] : ["", ""],
      );
      state.skipped = Array(state.session.answerPairs.length).fill(false);
      state.sessionSaved = false;
      state.phase = "memorize";
      render();
      startTimer();
    });

  const btnStop = document.getElementById("btn-stop");
  if (btnStop)
    btnStop.addEventListener("click", () => {
      stopTimer();
      state.phase = "answer";
      render();
      focusFirst();
    });

  const count = state.session?.answerPairs?.length || 0;
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < 2; col++) {
      const inp = document.getElementById(`inp-${row}-${col}`);
      if (!inp) continue;

      inp.addEventListener("input", (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
        e.target.value = val;
        state.answers[row][col] = val;
        if (val) {
          const isSingle = state.session.answerPairs[row].pair.length === 1;
          if (col === 0 && !isSingle) focusInp(row, 1);
          else focusNextRow(row);
        }
        updateCheckBtn();
      });

      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (state.answers[row][col] !== "") {
            state.answers[row][col] = "";
            e.target.value = "";
            updateCheckBtn();
          } else {
            if (col === 1) focusInp(row, 0);
            else if (row > 0) {
              const prevIsSingle = state.session.answerPairs[row - 1]?.pair.length === 1;
              focusInp(row - 1, prevIsSingle ? 0 : 1);
            }
          }
        }
        if (e.key === " ") {
          e.preventDefault();
          skipRow(row);
        }
      });
    }

    const btnSkip = document.querySelector(`[data-skip="${row}"]`);
    if (btnSkip) btnSkip.addEventListener("click", () => skipRow(row));
  }

  const btnHistory = document.getElementById("btn-history");
  if (btnHistory) btnHistory.addEventListener("click", () => { state.phase = "history"; render(); });

  const btnBack = document.getElementById("btn-back");
  if (btnBack) btnBack.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnReset = document.getElementById("btn-reset");
  if (btnReset)
    btnReset.addEventListener("click", () => {
      if (confirm("Usunąć całą historię?")) {
        localStorage.removeItem("bld-history");
        render();
      }
    });

  const btnCheck = document.getElementById("btn-check");
  if (btnCheck)
    btnCheck.addEventListener("click", () => {
      saveToHistory();
      state.phase = "result";
      render();
    });

  const btnConfig = document.getElementById("btn-config");
  if (btnConfig) btnConfig.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnRetry = document.getElementById("btn-retry");
  if (btnRetry)
    btnRetry.addEventListener("click", () => {
      state.memTime = 0;
      state.answers = state.session.answerPairs.map(({ pair }) =>
        pair.length === 1 ? [""] : ["", ""],
      );
      state.skipped = Array(state.session.answerPairs.length).fill(false);
      state.sessionSaved = false;
      state.phase = "memorize";
      render();
      startTimer();
    });

  const btnNew = document.getElementById("btn-new");
  if (btnNew)
    btnNew.addEventListener("click", () => {
      state.session = generateSession(state.mode, state.cornerCount, state.edgeCount);
      state.memTime = 0;
      state.answers = state.session.answerPairs.map(({ pair }) =>
        pair.length === 1 ? [""] : ["", ""],
      );
      state.skipped = Array(state.session.answerPairs.length).fill(false);
      state.sessionSaved = false;
      state.phase = "memorize";
      render();
      startTimer();
    });
}

function skipRow(row) {
  state.skipped[row] = true;
  state.answers[row] = ["", ""];
  render();
  focusNextRow(row);
}

function focusInp(row, col) {
  const el = document.getElementById(`inp-${row}-${col}`);
  if (el) el.focus();
}

function focusNextRow(row) {
  const count = state.session?.answerPairs?.length || 0;
  let next = row + 1;
  while (next < count && state.skipped[next]) next++;
  setTimeout(() => focusInp(next, 0), 0);
}

function focusFirst() {
  setTimeout(() => focusInp(0, 0), 50);
}

function updateCheckBtn() {
  const btn = document.getElementById("btn-check");
  if (!btn) return;
  const allDone = state.answers.every(
    (ans, i) => state.skipped[i] || ans.every((v) => v),
  );
  btn.disabled = !allDone;
  if (allDone)
    setTimeout(() => {
      saveToHistory();
      state.phase = "result";
      render();
    }, 400);
}

// ─── TIMER ────────────────────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    state.memTime++;
    const el = document.getElementById("timer-display");
    if (el) el.textContent = fmt(state.memTime);
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
render();
