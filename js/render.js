import {
  state,
  isAnswerCorrect,
  allDone,
  loadHistory,
  removeLastHistory,
} from "./state.js";
import { bindEvents } from "./events.js";
import { formatTime } from "./timer.js";
import { getMemoWord } from "./memo.js";

const BUILD = "v2.23 · 7.07";

export function render() {
  const app = document.getElementById("app");
  if (state.phase === "config") app.innerHTML = renderConfig();
  else if (state.phase === "memorize") app.innerHTML = renderMemorize();
  else if (state.phase === "answer") app.innerHTML = renderAnswer();
  else if (state.phase === "result") app.innerHTML = renderResult();
  else if (state.phase === "history") app.innerHTML = renderHistory();
  else if (state.phase === "settings") app.innerHTML = renderSettings();
  else if (state.phase === "settings4") app.innerHTML = renderSettings4BLD();
  else if (state.phase === "settings5") app.innerHTML = renderSettings5BLD();
  else if (state.phase === "help") app.innerHTML = renderHelp();
  bindEvents();
}

function renderConfig() {
  const cubeToggle = `
    <div class="cube-toggle cube-toggle-4">
      <button class="cube-btn${state.cubeType === "3op" ? " active" : ""}" data-cube="3op">3OP</button>
      <button class="cube-btn${state.cubeType === "3style" ? " active" : ""}" data-cube="3style">3Style</button>
      <button class="cube-btn${state.cubeType === "4bld" ? " active" : ""}" data-cube="4bld">4BLD</button>
      <button class="cube-btn${state.cubeType === "5bld" ? " active" : ""}" data-cube="5bld">5BLD</button>
    </div>`;

  if (state.cubeType === "5bld") {
    return renderConfig5BLD(cubeToggle);
  }
  if (state.cubeType === "4bld") {
    return renderConfig4BLD(cubeToggle);
  }
  return renderConfig3x3(cubeToggle);
}

function renderConfig3x3(cubeToggle) {
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
    ${cubeToggle}
    <div class="field-label">Tryb treningu</div>
    <div class="mode-grid">
      ${modeBtn("corners", "Rogi", "")}
      ${modeBtn("edges", "Krawędzie", "")}
      ${modeBtn("mixed", "Całość", "")}
    </div>
    ${
      showCorners
        ? `
    <div class="field-label">Liczba par — rogi</div>
    <div class="count-row">
      ${[2, 3, 4, 5, "?"].map((n) => countBtn(n, state.cornerCount, "corner")).join("")}
    </div>`
        : ""
    }
    ${
      showEdges
        ? `
    <div class="field-label">Liczba par — krawędzie</div>
    <div class="count-row">
      ${[4, 5, 6, 7, "?"].map((n) => countBtn(n, state.edgeCount, "edge")).join("")}
    </div>`
        : ""
    }
    <button class="btn-primary" id="btn-start">Losuj i zapamiętaj →</button>
    <div class="config-links">
      <button class="btn-config-link" id="btn-help">Jak grać?</button>
      <button class="btn-config-link" id="btn-settings">Schemat liter</button>
    </div>
    <div class="build-info"><div class="build-links"><a class="build-link" href="https://grzegorzpacewicz.pl" target="_blank" rel="noopener">grzegorzpacewicz.pl</a><a class="build-link" href="https://github.com/GrzegorzPacewicz/bld-pairs" target="_blank" rel="noopener"><svg class="github-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg> GitHub</a></div><span>${BUILD}</span></div>
  </div></div>`;
}

function renderConfig4BLD(cubeToggle) {
  const showCorners =
    state.mode4BLD === "corners" || state.mode4BLD === "mixed";
  const showWings = state.mode4BLD === "wings" || state.mode4BLD === "mixed";
  const showCenters =
    state.mode4BLD === "centers" || state.mode4BLD === "mixed";

  const modeBtn = (id, label, sub) =>
    `<button class="mode4-btn${state.mode4BLD === id ? " active" : ""}" data-mode4="${id}">
      <span class="mode-label">${label}</span>
      <span class="mode-sub">${sub}</span>
    </button>`;

  const countBtn = (val, current, type) =>
    `<button class="count4-btn${current === val ? " active" : ""}" data-count="${val}" data-type="${type}">${val}</button>`;

  return `<div class="screen"><div class="card">
    <div class="logo">BLD<span class="accent">pairs</span> <span class="cube-badge">4x4</span></div>
    <p class="sub">Trening par liter — blind solving</p>
    ${cubeToggle}
    <div class="field-label">Tryb treningu</div>
    <div class="mode-grid mode-grid-4">
      ${modeBtn("corners", "Rogi", "")}
      ${modeBtn("wings", "Wingsy", "")}
      ${modeBtn("centers", "Centry", "")}
      ${modeBtn("mixed", "Całość", "")}
    </div>
    ${
      showCorners
        ? `
    <div class="field-label">Liczba par — rogi</div>
    <div class="count-row">
      ${[2, 3, 4, 5, "?"].map((n) => countBtn(n, state.cornerCount, "corner")).join("")}
    </div>`
        : ""
    }
    ${
      showWings
        ? `
    <div class="field-label">Liczba par — wingsy</div>
    <div class="count-row">
      ${[11, 12, "?"].map((n) => countBtn(n, state.wingsCount, "wings")).join("")}
    </div>`
        : ""
    }
    ${
      showCenters
        ? `
    <div class="field-label">Liczba par — centry</div>
    <div class="count-row">
      ${[6, 7, 8, "?"].map((n) => countBtn(n, state.centersCount, "centers")).join("")}
    </div>`
        : ""
    }
    <button class="btn-primary" id="btn-start">Losuj i zapamiętaj →</button>
    <div class="config-links">
      <button class="btn-config-link" id="btn-help">Jak grać?</button>
      <button class="btn-config-link" id="btn-settings">Schemat liter</button>
    </div>
    <div class="build-info"><div class="build-links"><a class="build-link" href="https://grzegorzpacewicz.pl" target="_blank" rel="noopener">grzegorzpacewicz.pl</a><a class="build-link" href="https://github.com/GrzegorzPacewicz/bld-pairs" target="_blank" rel="noopener"><svg class="github-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg> GitHub</a></div><span>${BUILD}</span></div>
  </div></div>`;
}

function renderConfig5BLD(cubeToggle) {
  const showCorners =
    state.mode5BLD === "corners" || state.mode5BLD === "mixed";
  const showWings = state.mode5BLD === "wings" || state.mode5BLD === "mixed";
  const showMidges = state.mode5BLD === "midges" || state.mode5BLD === "mixed";
  const showTcenters =
    state.mode5BLD === "tcenters" || state.mode5BLD === "mixed";
  const showXcenters =
    state.mode5BLD === "xcenters" || state.mode5BLD === "mixed";

  const modeBtn = (id, label) =>
    `<button class="mode5-btn${state.mode5BLD === id ? " active" : ""}" data-mode5="${id}">
      <span class="mode-label">${label}</span>
    </button>`;

  const countBtn = (val, current, type) =>
    `<button class="count5-btn${current === val ? " active" : ""}" data-count="${val}" data-type="${type}">${val}</button>`;

  return `<div class="screen"><div class="card">
    <div class="logo">BLD<span class="accent">pairs</span> <span class="cube-badge">5x5</span></div>
    <p class="sub">Trening par liter — blind solving</p>
    ${cubeToggle}
    <div class="field-label">Tryb treningu</div>
    <div class="mode-grid mode-grid-6">
      ${modeBtn("corners", "Rogi")}
      ${modeBtn("wings", "Wingsy")}
      ${modeBtn("midges", "Midges")}
      ${modeBtn("tcenters", "T-centry")}
      ${modeBtn("xcenters", "X-centry")}
      ${modeBtn("mixed", "Całość")}
    </div>
    ${
      showCorners
        ? `
    <div class="field-label">Liczba par — rogi</div>
    <div class="count-row">
      ${[2, 3, 4, 5, "?"].map((n) => countBtn(n, state.cornerCount, "corner")).join("")}
    </div>`
        : ""
    }
    ${
      showWings
        ? `
    <div class="field-label">Liczba par — wingsy</div>
    <div class="count-row">
      ${[11, 12, "?"].map((n) => countBtn(n, state.wingsCount5, "wings5")).join("")}
    </div>`
        : ""
    }
    ${
      showMidges
        ? `
    <div class="field-label">Liczba par — midges</div>
    <div class="count-row">
      ${[4, 5, 6, 7, "?"].map((n) => countBtn(n, state.midgesCount, "midges")).join("")}
    </div>`
        : ""
    }
    ${
      showTcenters
        ? `
    <div class="field-label">Liczba par — t-centry</div>
    <div class="count-row">
      ${[7, 8, 9, "?"].map((n) => countBtn(n, state.tcentersCount, "tcenters")).join("")}
    </div>`
        : ""
    }
    ${
      showXcenters
        ? `
    <div class="field-label">Liczba par — x-centry</div>
    <div class="count-row">
      ${[7, 8, 9, "?"].map((n) => countBtn(n, state.xcentersCount, "xcenters")).join("")}
    </div>`
        : ""
    }
    <button class="btn-primary" id="btn-start">Losuj i zapamiętaj →</button>
    <div class="config-links">
      <button class="btn-config-link" id="btn-help">Jak grać?</button>
      <button class="btn-config-link" id="btn-settings">Schemat liter</button>
    </div>
    <div class="build-info"><div class="build-links"><a class="build-link" href="https://grzegorzpacewicz.pl" target="_blank" rel="noopener">grzegorzpacewicz.pl</a><a class="build-link" href="https://github.com/GrzegorzPacewicz/bld-pairs" target="_blank" rel="noopener"><svg class="github-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg> GitHub</a></div><span>${BUILD}</span></div>
  </div></div>`;
}

function renderMemorize() {
  const corners = state.session.displayPairs.filter(
    (p) => p.type === "corner" || p.type === "corner-single",
  );
  const edges = state.session.displayPairs.filter(
    (p) => p.type === "edge" || p.type === "edge-single",
  );
  const wings = state.session.displayPairs.filter(
    (p) => p.type === "wing" || p.type === "wing-single",
  );
  const centers = state.session.displayPairs.filter(
    (p) => p.type === "center" || p.type === "center-single",
  );
  const midges = state.session.displayPairs.filter(
    (p) => p.type === "midge" || p.type === "midge-single",
  );
  const tcenters = state.session.displayPairs.filter(
    (p) => p.type === "tcenter" || p.type === "tcenter-single",
  );
  const xcenters = state.session.displayPairs.filter(
    (p) => p.type === "xcenter" || p.type === "xcenter-single",
  );

  const chips = (arr, cls) =>
    arr
      .map((p) =>
        p.pair.length === 1
          ? `<div class="pair-chip ${cls} singiel-chip"><span class="ltr">${p.pair[0]}</span></div>`
          : `<div class="pair-chip ${cls}">
      <span class="ltr">${p.pair[0]}</span>
      <span class="ltr">${p.pair[1]}</span>
    </div>`,
      )
      .join("");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-cancel">←</button>
      <span class="phase-title">Zapamiętaj</span>
      <span class="timer" id="timer-display">${formatTime(state.memTime)}</span>
    </div>
    ${xcenters.length ? `<div class="section-tag xcenter-tag">X-CENTRY</div><div class="pairs-wrap">${chips(xcenters, "xcenter-chip")}</div>` : ""}
    ${tcenters.length ? `<div class="section-tag tcenter-tag">T-CENTRY</div><div class="pairs-wrap">${chips(tcenters, "tcenter-chip")}</div>` : ""}
    ${centers.length ? `<div class="section-tag center-tag">CENTRY</div><div class="pairs-wrap">${chips(centers, "center-chip")}</div>` : ""}
    ${midges.length ? `<div class="section-tag midge-tag">MIDGES</div><div class="pairs-wrap">${chips(midges, "midge-chip")}</div>` : ""}
    ${wings.length ? `<div class="section-tag wing-tag">WINGSY</div><div class="pairs-wrap">${chips(wings, "wing-chip")}</div>` : ""}
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="pairs-wrap">${chips(corners, "corner-chip")}</div>` : ""}
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="pairs-wrap">${chips(edges, "edge-chip")}</div>` : ""}
    <button class="btn-stop" id="btn-stop">■ STOP — przejdź do odpowiedzi</button>
  </div></div>`;
}

function renderAnswer() {
  const ap = state.session.answerPairs;
  const edges = ap.filter((p) => p.type === "edge" || p.type === "edge-single");
  const corners = ap.filter(
    (p) => p.type === "corner" || p.type === "corner-single",
  );
  const wings = ap.filter((p) => p.type === "wing" || p.type === "wing-single");
  const centers = ap.filter(
    (p) => p.type === "center" || p.type === "center-single",
  );
  const midges = ap.filter(
    (p) => p.type === "midge" || p.type === "midge-single",
  );
  const tcenters = ap.filter(
    (p) => p.type === "tcenter" || p.type === "tcenter-single",
  );
  const xcenters = ap.filter(
    (p) => p.type === "xcenter" || p.type === "xcenter-single",
  );

  let offset = 0;
  const xcenterOffset = offset;
  offset += xcenters.length;
  const tcenterOffset = offset;
  offset += tcenters.length;
  const centerOffset = offset;
  offset += centers.length;
  const midgeOffset = offset;
  offset += midges.length;
  const wingOffset = offset;
  offset += wings.length;
  const edgeOffset = offset;
  offset += edges.length;
  const cornerOffset = offset;

  const rowHtml = (row) => {
    const sk = state.skipped[row];
    const isSingle = ap[row].pair.length === 1;
    return `<div class="answer-row${sk ? " skipped" : ""}" data-row="${row}">
      ${
        sk
          ? `<span class="skip-label">— pominięto</span>`
          : isSingle
            ? `<input class="li" id="inp-${row}-0" value="${state.answers[row]?.[0] || ""}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">
             <button class="btn-skip-text" data-skip="${row}">Pomiń</button>`
            : `<input class="li" id="inp-${row}-0" value="${state.answers[row]?.[0] || ""}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">
           <input class="li" id="inp-${row}-1" value="${state.answers[row]?.[1] || ""}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">
           <button class="btn-skip-text" data-skip="${row}">Pomiń</button>`
      }
    </div>`;
  };

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <span class="phase-title">Wpisz z pamięci</span>
      <span class="muted-t">⏱ ${formatTime(state.memTime)}</span>
    </div>
    ${xcenters.length ? `<div class="section-tag xcenter-tag">X-CENTRY</div><div class="answer-list">${xcenters.map((_, i) => rowHtml(xcenterOffset + i)).join("")}</div>` : ""}
    ${tcenters.length ? `<div class="section-tag tcenter-tag">T-CENTRY</div><div class="answer-list">${tcenters.map((_, i) => rowHtml(tcenterOffset + i)).join("")}</div>` : ""}
    ${centers.length ? `<div class="section-tag center-tag">CENTRY</div><div class="answer-list">${centers.map((_, i) => rowHtml(centerOffset + i)).join("")}</div>` : ""}
    ${midges.length ? `<div class="section-tag midge-tag">MIDGES</div><div class="answer-list">${midges.map((_, i) => rowHtml(midgeOffset + i)).join("")}</div>` : ""}
    ${wings.length ? `<div class="section-tag wing-tag">WINGSY</div><div class="answer-list">${wings.map((_, i) => rowHtml(wingOffset + i)).join("")}</div>` : ""}
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="answer-list">${edges.map((_, i) => rowHtml(edgeOffset + i)).join("")}</div>` : ""}
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="answer-list">${corners.map((_, i) => rowHtml(cornerOffset + i)).join("")}</div>` : ""}
    <button class="btn-primary" id="btn-check" ${allDone() ? "" : "disabled"}>Sprawdź →</button>
  </div></div>`;
}

function renderResult() {
  const ap = state.session.answerPairs;
  const results = ap.map(({ pair, type }, i) => {
    if (state.skipped[i])
      return { status: "skipped", pair, given: ["", ""], type };
    const ans = state.answers[i];
    return {
      status: isAnswerCorrect(pair, ans) ? "ok" : "fail",
      pair,
      given: ans,
      type,
    };
  });

  const score = results.filter((r) => r.status === "ok").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const pct = Math.round((score / results.length) * 100);

  const resRow = ({ status, pair, given }) => {
    const memoWord = getMemoWord(pair);
    return `<div class="res-row ${status}">
      <span class="exp">${pair.length === 1 ? pair[0] : `${pair[0]} ${pair[1]}`}</span>
      ${memoWord ? `<span class="memo-word">${memoWord}</span>` : ""}
      ${status === "fail" ? `<span class="got">wpisałeś: ${given[0] || "?"}${pair.length === 2 ? given[1] || "?" : ""}</span>` : ""}
      ${status === "skipped" ? `<span class="got">pominięto</span>` : ""}
      <span class="icon">${status === "ok" ? "✓" : status === "skipped" ? "—" : "✗"}</span>
    </div>`;
  };

  const edges = results.filter(
    (r) => r.type === "edge" || r.type === "edge-single",
  );
  const corners = results.filter(
    (r) => r.type === "corner" || r.type === "corner-single",
  );
  const wings = results.filter(
    (r) => r.type === "wing" || r.type === "wing-single",
  );
  const centers = results.filter(
    (r) => r.type === "center" || r.type === "center-single",
  );
  const midges = results.filter(
    (r) => r.type === "midge" || r.type === "midge-single",
  );
  const tcenters = results.filter(
    (r) => r.type === "tcenter" || r.type === "tcenter-single",
  );
  const xcenters = results.filter(
    (r) => r.type === "xcenter" || r.type === "xcenter-single",
  );

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-config">⚙</button>
      <span class="phase-title">Wynik</span>
      <span class="score-inline">${score}/${results.length} · ${pct}%</span>
    </div>
    ${skippedCount > 0 ? `<div class="skip-note">pominięto: ${skippedCount}</div>` : ""}
    <div class="mem-line">czas zapamiętywania: ${formatTime(state.memTime)}</div>
    ${xcenters.length ? `<div class="section-tag xcenter-tag">X-CENTRY</div>${xcenters.map(resRow).join("")}` : ""}
    ${tcenters.length ? `<div class="section-tag tcenter-tag">T-CENTRY</div>${tcenters.map(resRow).join("")}` : ""}
    ${centers.length ? `<div class="section-tag center-tag">CENTRY</div>${centers.map(resRow).join("")}` : ""}
    ${midges.length ? `<div class="section-tag midge-tag">MIDGES</div>${midges.map(resRow).join("")}` : ""}
    ${wings.length ? `<div class="section-tag wing-tag">WINGSY</div>${wings.map(resRow).join("")}` : ""}
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div>${edges.map(resRow).join("")}` : ""}
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div>${corners.map(resRow).join("")}` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-retry">↺ Powtórz</button>
      <button class="btn-primary"   id="btn-new">Kolejna →</button>
    </div>
    <button class="btn-history" id="btn-history">Statystyki</button>
  </div></div>`;
}

function renderHistory() {
  const history = loadHistory();
  const modeLabel = {
    corners: "Rogi",
    edges: "Krawędzie",
    mixed: "Całość",
    wings: "Wingsy",
    centers: "Centry",
    midges: "Midges",
    tcenters: "T-centry",
    xcenters: "X-centry",
  };

  const totalSessions = history.length;
  const totalPairs = history.reduce((s, e) => s + e.total, 0);
  const totalCorrect = history.reduce((s, e) => s + e.correct, 0);
  const perfectCount = history.filter(
    (e) => e.correct === e.total && e.skipped === 0,
  ).length;

  const pairPct = totalPairs
    ? Math.round((totalCorrect / totalPairs) * 100)
    : "—";
  const perfectPct = totalSessions
    ? Math.round((perfectCount / totalSessions) * 100)
    : "—";
  const failedPct = totalSessions
    ? Math.round(((totalSessions - perfectCount) / totalSessions) * 100)
    : "—";
  const avgTime = totalSessions
    ? formatTime(
        Math.round(history.reduce((s, e) => s + e.time, 0) / totalSessions),
      )
    : "—";
  const avgPct = totalSessions
    ? Math.round(
        history.reduce((s, e) => s + (e.correct / e.total) * 100, 0) /
          totalSessions,
      ) + "%"
    : "—";

  const formatTimeDate = (ts) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) +
      " " +
      d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const rows = history
    .slice(0, 50)
    .map((e) => {
      const perfect = e.correct === e.total && e.skipped === 0;
      const cubePrefix = e.is5BLD
        ? "5BLD "
        : e.is4BLD
          ? "4BLD "
          : e.cubeType === "3op"
            ? "3OP "
            : "";
      return `<div class="hist-row${perfect ? " hist-ok" : " hist-fail"}">
      <span class="hist-date">${formatTimeDate(e.ts)}</span>
      <span class="hist-mode">${cubePrefix}${modeLabel[e.mode] || e.mode}</span>
      <span class="hist-score">${e.correct}/${e.total}</span>
      <span class="hist-time">${formatTime(e.time)}</span>
      <span class="hist-icon">${perfect ? "✓" : "✗"}</span>
    </div>`;
    })
    .join("");

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
    ${
      totalSessions === 0
        ? `<div class="hist-empty">Brak sesji. Zagraj pierwszą grę!</div>`
        : `<div class="hist-list">${rows}</div>`
    }
    ${totalSessions > 0 ? `<div class="hist-actions"><button class="btn-remove-last" id="btn-remove-last">Usuń ostatnią</button><button class="btn-reset-history" id="btn-reset">Usuń wszystko</button></div>` : ""}
  </div></div>`;
}

function renderHelp() {
  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-help-back">←</button>
      <span class="phase-title">Jak grać?</span>
      <span></span>
    </div>

    <p class="help-intro">Aplikacja trenuje zapamiętywanie par liter używanych przy układaniu kostki Rubika bez patrzenia (BLD).</p>

    <div class="field-label">3OP (Old Pochmann)</div>
    <p class="help-text">Rogi i krawędzie parami. Parzystość zsynchronizowana — singiel w rogach = singiel w krawędziach.</p>

    <div class="field-label">3Style</div>
    <p class="help-text">Rogi (7 kawałków × 3 litery) z singlem parity. Krawędzie (11 kawałków × 2 litery) zawsze parzyste.</p>

    <div class="field-label">4BLD</div>
    <p class="help-text">Rogi (jak 3x3), wingsy (23 litery) i centry (23 litery). Każda litera to osobny kawałek.</p>

    <div class="field-label">Jak wygląda gra</div>
    <ol class="help-steps">
      <li>Wybierz tryb i liczbę par</li>
      <li>Zapamiętaj wylosowane pary</li>
      <li>Naciśnij <strong>STOP</strong> (lub spację) i wpisz z pamięci</li>
      <li>Sprawdź wynik</li>
    </ol>

    <div class="field-label">Skróty klawiszowe</div>
    <div class="help-keys">
      <div class="help-key-row"><kbd>Spacja</kbd><span>zakończ memo / pomiń parę</span></div>
      <div class="help-key-row"><kbd>litera</kbd><span>wpisz i przeskocz dalej</span></div>
      <div class="help-key-row"><kbd>Backspace</kbd><span>usuń / cofnij kursor</span></div>
    </div>

    <button class="btn-primary" id="btn-help-start" style="margin-top:1.5rem">Zacznij →</button>
  </div></div>`;
}

function renderSettings() {
  const groupRow = (group, stype, gidx) => {
    const cls = stype === "corner" ? "corner-li" : "edge-li";
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li ${cls}" data-stype="${stype}" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const cornerRows = state.settingsCorners
    .map((g, i) => groupRow(g, "corner", i))
    .join("");
  const edgeRows = state.settingsEdges
    .map((g, i) => groupRow(g, "edge", i))
    .join("");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-settings-back">←</button>
      <span class="phase-title">Schemat liter</span>
      <span></span>
    </div>
    <p class="schema-intro">Wpisz litery — kursor przeskakuje automatycznie. Każda litera musi być unikalna.</p>
    <div class="field-label">Rogi <span class="schema-type-hint">7 × 3 litery</span></div>
    <div class="schema-list">${cornerRows}</div>
    <div class="field-label">Krawędzie <span class="schema-type-hint">11 × 2 litery</span></div>
    <div class="schema-list">${edgeRows}</div>
    ${state.settingsError ? `<div class="schema-error">${state.settingsError}</div>` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-schema-reset">Przywróć domyślne</button>
      <button class="btn-primary" id="btn-schema-save">Zapisz →</button>
    </div>
  </div></div>`;
}

function renderSettings4BLD() {
  const MAX_WINGS = 23;

  const cornerRow = (group, gidx) => {
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li corner-li" data-stype="corner4" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const centerRow = (group, gidx) => {
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li center-li" data-stype="centers4" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const cornerRows = state.settings4Corners
    .map((g, i) => cornerRow(g, i))
    .join("");

  const centerRows = state.settings4Centers
    .map((g, i) => centerRow(g, i))
    .join("");

  const wingLetters = state.settings4Wings.flat();

  const wingInputs = [];
  for (let i = 0; i < MAX_WINGS; i++) {
    const val = wingLetters[i] || "";
    wingInputs.push(
      `<input class="li schema-li schema-flat-li wing-li" data-stype="wings" data-idx="${i}"
        value="${val}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
    );
  }

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-settings4-back">←</button>
      <span class="phase-title">Schemat 4BLD</span>
      <span></span>
    </div>
    <p class="schema-intro">Wpisz litery — kursor przeskakuje automatycznie. Każda litera musi być unikalna.</p>
    <div class="field-label">Rogi <span class="schema-type-hint">7 × 3 litery</span></div>
    <div class="schema-list">${cornerRows}</div>
    <div class="field-label">Wingsy <span class="schema-type-hint">${wingLetters.filter((l) => l).length}/${MAX_WINGS}</span></div>
    <div class="schema-flat-grid schema-flat-grid-single">${wingInputs.join("")}</div>
    <div class="field-label">Centry <span class="schema-type-hint">1×3 + 5×4 litery</span></div>
    <div class="schema-list">${centerRows}</div>
    ${state.settingsError ? `<div class="schema-error">${state.settingsError}</div>` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-schema4-reset">Przywróć domyślne</button>
      <button class="btn-primary" id="btn-schema4-save">Zapisz →</button>
    </div>
  </div></div>`;
}

function renderSettings5BLD() {
  const MAX_WINGS = 23;

  const cornerRow = (group, gidx) => {
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li corner-li" data-stype="corner5" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const midgeRow = (group, gidx) => {
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li midge-li" data-stype="midges5" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const tcenterRow = (group, gidx) => {
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li tcenter-li" data-stype="tcenters5" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const xcenterRow = (group, gidx) => {
    const inputs = group
      .map(
        (l, cidx) =>
          `<input class="li schema-li xcenter-li" data-stype="xcenters5" data-gidx="${gidx}" data-cidx="${cidx}"
        value="${l}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
      )
      .join("");
    return `<div class="schema-row">
      <span class="schema-num">${gidx + 1}</span>
      ${inputs}
    </div>`;
  };

  const cornerRows = state.settings5Corners
    .map((g, i) => cornerRow(g, i))
    .join("");
  const midgeRows = state.settings5Midges
    .map((g, i) => midgeRow(g, i))
    .join("");
  const tcenterRows = state.settings5Tcenters
    .map((g, i) => tcenterRow(g, i))
    .join("");
  const xcenterRows = state.settings5Xcenters
    .map((g, i) => xcenterRow(g, i))
    .join("");

  const wingLetters = state.settings5Wings.flat();

  const wingInputs = [];
  for (let i = 0; i < MAX_WINGS; i++) {
    const val = wingLetters[i] || "";
    wingInputs.push(
      `<input class="li schema-li schema-flat-li wing5-li" data-stype="wings5" data-idx="${i}"
        value="${val}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
    );
  }

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-settings5-back">←</button>
      <span class="phase-title">Schemat 5BLD</span>
      <span></span>
    </div>
    <p class="schema-intro">Wpisz litery — kursor przeskakuje automatycznie. Każda litera musi być unikalna.</p>
    <div class="field-label">Rogi <span class="schema-type-hint">7 × 3 litery</span></div>
    <div class="schema-list">${cornerRows}</div>
    <div class="field-label">Wingsy <span class="schema-type-hint">${wingLetters.filter((l) => l).length}/${MAX_WINGS}</span></div>
    <div class="schema-flat-grid schema-flat-grid-single">${wingInputs.join("")}</div>
    <div class="field-label">Midges <span class="schema-type-hint">11 × 2 litery</span></div>
    <div class="schema-list">${midgeRows}</div>
    <div class="field-label">T-centry <span class="schema-type-hint">1×3 + 5×4 litery</span></div>
    <div class="schema-list">${tcenterRows}</div>
    <div class="field-label">X-centry <span class="schema-type-hint">1×3 + 5×4 litery</span></div>
    <div class="schema-list">${xcenterRows}</div>
    ${state.settingsError ? `<div class="schema-error">${state.settingsError}</div>` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-schema5-reset">Przywróć domyślne</button>
      <button class="btn-primary" id="btn-schema5-save">Zapisz →</button>
    </div>
  </div></div>`;
}
