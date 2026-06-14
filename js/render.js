import { state, isAnswerCorrect, allDone, loadHistory } from "./state.js";
import { bindEvents } from "./events.js";
import { formatTime } from "./timer.js";

const BUILD = "v2.14 · 14.06";

export function render() {
  const app = document.getElementById("app");
  if (state.phase === "config") app.innerHTML = renderConfig();
  else if (state.phase === "memorize") app.innerHTML = renderMemorize();
  else if (state.phase === "answer") app.innerHTML = renderAnswer();
  else if (state.phase === "result") app.innerHTML = renderResult();
  else if (state.phase === "history") app.innerHTML = renderHistory();
  else if (state.phase === "settings") app.innerHTML = renderSettings();
  else if (state.phase === "settings4") app.innerHTML = renderSettings4BLD();
  else if (state.phase === "help") app.innerHTML = renderHelp();
  bindEvents();
}

function renderConfig() {
  const cubeToggle = `
    <div class="cube-toggle">
      <button class="cube-btn${!state.is4BLD ? " active" : ""}" data-cube="3x3">3x3</button>
      <button class="cube-btn${state.is4BLD ? " active" : ""}" data-cube="4x4">4x4</button>
    </div>`;

  if (state.is4BLD) {
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
      ${modeBtn("corners", "Rogi", "tylko rogi")}
      ${modeBtn("edges", "Krawędzie", "tylko krawędzie")}
      ${modeBtn("mixed", "Mieszany", "rogi + krawędzie")}
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
      ${modeBtn("corners", "Rogi", "tylko rogi")}
      ${modeBtn("wings", "Wingsy", "tylko wingsy")}
      ${modeBtn("centers", "Centry", "tylko centry")}
      ${modeBtn("mixed", "Mieszany", "wszystko")}
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

function renderMemorize() {
  const corners = state.session.displayPairs.filter(
    (p) => p.type === "corner" || p.type === "corner-single",
  );
  const edges = state.session.displayPairs.filter((p) => p.type === "edge");
  const wings = state.session.displayPairs.filter(
    (p) => p.type === "wing" || p.type === "wing-single",
  );
  const centers = state.session.displayPairs.filter(
    (p) => p.type === "center" || p.type === "center-single",
  );

  const chips = (arr, cls) =>
    arr
      .map((p) =>
        p.pair.length === 1
          ? `<div class="pair-chip ${cls} singiel-chip"><span class="ltr">${p.pair[0]}</span></div>`
          : `<div class="pair-chip ${cls}">
      <span class="ltr">${p.pair[0]}</span>
      <span class="dash">–</span>
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
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="pairs-wrap">${chips(corners, "corner-chip")}</div>` : ""}
    ${wings.length ? `<div class="section-tag wing-tag">WINGSY</div><div class="pairs-wrap">${chips(wings, "wing-chip")}</div>` : ""}
    ${centers.length ? `<div class="section-tag center-tag">CENTRY</div><div class="pairs-wrap">${chips(centers, "center-chip")}</div>` : ""}
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="pairs-wrap">${chips(edges, "edge-chip")}</div>` : ""}
    <button class="btn-stop" id="btn-stop">■ STOP — przejdź do odpowiedzi</button>
  </div></div>`;
}

function renderAnswer() {
  const ap = state.session.answerPairs;
  const edges = ap.filter((p) => p.type === "edge");
  const corners = ap.filter(
    (p) => p.type === "corner" || p.type === "corner-single",
  );
  const wings = ap.filter((p) => p.type === "wing" || p.type === "wing-single");
  const centers = ap.filter(
    (p) => p.type === "center" || p.type === "center-single",
  );

  let offset = 0;
  const edgeOffset = offset;
  offset += edges.length;
  const wingOffset = offset;
  offset += wings.length;
  const centerOffset = offset;
  offset += centers.length;
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
           <span class="dash">–</span>
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
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="answer-list">${edges.map((_, i) => rowHtml(edgeOffset + i)).join("")}</div>` : ""}
    ${wings.length ? `<div class="section-tag wing-tag">WINGSY</div><div class="answer-list">${wings.map((_, i) => rowHtml(wingOffset + i)).join("")}</div>` : ""}
    ${centers.length ? `<div class="section-tag center-tag">CENTRY</div><div class="answer-list">${centers.map((_, i) => rowHtml(centerOffset + i)).join("")}</div>` : ""}
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

  const resRow = ({ status, pair, given }) =>
    `<div class="res-row ${status}">
      <span class="exp">${pair.length === 1 ? pair[0] : `${pair[0]}–${pair[1]}`}</span>
      ${status === "fail" ? `<span class="got">wpisałeś: ${given[0] || "?"}${pair.length === 2 ? given[1] || "?" : ""}</span>` : ""}
      ${status === "skipped" ? `<span class="got">pominięto</span>` : ""}
      <span class="icon">${status === "ok" ? "✓" : status === "skipped" ? "—" : "✗"}</span>
    </div>`;

  const edges = results.filter((r) => r.type === "edge");
  const corners = results.filter(
    (r) => r.type === "corner" || r.type === "corner-single",
  );
  const wings = results.filter(
    (r) => r.type === "wing" || r.type === "wing-single",
  );
  const centers = results.filter(
    (r) => r.type === "center" || r.type === "center-single",
  );

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-config">⚙</button>
      <span class="phase-title">Wynik</span>
      <span class="score-inline">${score}/${results.length} · ${pct}%</span>
    </div>
    ${skippedCount > 0 ? `<div class="skip-note">pominięto: ${skippedCount}</div>` : ""}
    <div class="mem-line">czas zapamiętywania: ${formatTime(state.memTime)}</div>
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div>${edges.map(resRow).join("")}` : ""}
    ${wings.length ? `<div class="section-tag wing-tag">WINGSY</div>${wings.map(resRow).join("")}` : ""}
    ${centers.length ? `<div class="section-tag center-tag">CENTRY</div>${centers.map(resRow).join("")}` : ""}
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
    mixed: "Mieszany",
    wings: "Wingsy",
    centers: "Centry",
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
      return `<div class="hist-row${perfect ? " hist-ok" : " hist-fail"}">
      <span class="hist-date">${formatTimeDate(e.ts)}</span>
      <span class="hist-mode">${e.is4BLD ? "4×4 " : ""}${modeLabel[e.mode] || e.mode}</span>
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
    ${totalSessions > 0 ? `<button class="btn-reset-history" id="btn-reset">Usuń historię</button>` : ""}
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

    <div class="field-label">3x3</div>
    <p class="help-text">Rogi (7 kawałków × 3 litery) i krawędzie (11 kawałków × 2 litery). Samotna litera to parity.</p>

    <div class="field-label">4x4</div>
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
  const MAX_CENTERS = 23;

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

  const cornerRows = state.settings4Corners
    .map((g, i) => cornerRow(g, i))
    .join("");

  const wingLetters = state.settings4Wings.flat();
  const centerLetters = state.settings4Centers.flat();

  const wingInputs = [];
  for (let i = 0; i < MAX_WINGS; i++) {
    const val = wingLetters[i] || "";
    wingInputs.push(
      `<input class="li schema-li schema-flat-li wing-li" data-stype="wings" data-idx="${i}"
        value="${val}" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false">`,
    );
  }

  const centerInputs = [];
  for (let i = 0; i < MAX_CENTERS; i++) {
    const val = centerLetters[i] || "";
    centerInputs.push(
      `<input class="li schema-li schema-flat-li center-li" data-stype="centers" data-idx="${i}"
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
    <div class="field-label">Centry <span class="schema-type-hint">${centerLetters.filter((l) => l).length}/${MAX_CENTERS}</span></div>
    <div class="schema-flat-grid schema-flat-grid-single">${centerInputs.join("")}</div>
    ${state.settingsError ? `<div class="schema-error">${state.settingsError}</div>` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-schema4-reset">Przywróć domyślne</button>
      <button class="btn-primary" id="btn-schema4-save">Zapisz →</button>
    </div>
  </div></div>`;
}
