import { state, isAnswerCorrect, allDone, loadHistory } from "./state.js";
import { bindEvents } from "./events.js";
import { formatTime } from "./timer.js";

const BUILD = "v1.14 · 12.06";

export function render() {
  const app = document.getElementById("app");
  if (state.phase === "config") app.innerHTML = renderConfig();
  else if (state.phase === "memorize") app.innerHTML = renderMemorize();
  else if (state.phase === "answer") app.innerHTML = renderAnswer();
  else if (state.phase === "result") app.innerHTML = renderResult();
  else if (state.phase === "history") app.innerHTML = renderHistory();
  else if (state.phase === "settings") app.innerHTML = renderSettings();
  else if (state.phase === "help") app.innerHTML = renderHelp();
  bindEvents();
}

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
      ${[2, 3, 4, 5, "?"].map((n) => countBtn(n, state.cornerCount, "corner")).join("")}
    </div>` : ""}
    ${showEdges ? `
    <div class="field-label">Liczba par — krawędzie</div>
    <div class="count-row">
      ${[4, 5, 6, 7, "?"].map((n) => countBtn(n, state.edgeCount, "edge")).join("")}
    </div>` : ""}
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
      <button class="btn-config-top" id="btn-cancel">←</button>
      <span class="phase-title">Zapamiętaj</span>
      <span class="timer" id="timer-display">${formatTime(state.memTime)}</span>
    </div>
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="pairs-wrap">${chips(corners, "corner-chip")}</div>` : ""}
    ${edges.length ? `<div class="section-tag edge-tag">KRAWĘDZIE</div><div class="pairs-wrap">${chips(edges, "edge-chip")}</div>` : ""}
    <button class="btn-stop" id="btn-stop">■ STOP — przejdź do odpowiedzi</button>
  </div></div>`;
}

function renderAnswer() {
  const ap = state.session.answerPairs;
  const edges = ap.filter((p) => p.type === "edge");
  const corners = ap.filter((p) => p.type === "corner" || p.type === "corner-single");
  const edgeOffset = 0;
  const cornerOffset = edges.length;

  const rowHtml = (row) => {
    const sk = state.skipped[row];
    const isSingle = ap[row].pair.length === 1;
    return `<div class="answer-row${sk ? " skipped" : ""}" data-row="${row}">
      ${sk
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
    ${corners.length ? `<div class="section-tag corner-tag">ROGI</div><div class="answer-list">${corners.map((_, i) => rowHtml(cornerOffset + i)).join("")}</div>` : ""}
    <button class="btn-primary" id="btn-check" ${allDone() ? "" : "disabled"}>Sprawdź →</button>
  </div></div>`;
}

function renderResult() {
  const ap = state.session.answerPairs;
  const results = ap.map(({ pair, type }, i) => {
    if (state.skipped[i]) return { status: "skipped", pair, given: ["", ""], type };
    const ans = state.answers[i];
    return { status: isAnswerCorrect(pair, ans) ? "ok" : "fail", pair, given: ans, type };
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
  const corners = results.filter((r) => r.type === "corner" || r.type === "corner-single");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-config">⚙</button>
      <span class="phase-title">Wynik</span>
      <span class="score-inline">${score}/${results.length} · ${pct}%</span>
    </div>
    ${skippedCount > 0 ? `<div class="skip-note">pominięto: ${skippedCount}</div>` : ""}
    <div class="mem-line">czas zapamiętywania: ${formatTime(state.memTime)}</div>
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
  const modeLabel = { corners: "Rogi", edges: "Krawędzie", mixed: "Mieszany" };

  const totalSessions = history.length;
  const totalPairs = history.reduce((s, e) => s + e.total, 0);
  const totalCorrect = history.reduce((s, e) => s + e.correct, 0);
  const perfectCount = history.filter(
    (e) => e.correct === e.total && e.skipped === 0,
  ).length;

  const pairPct = totalPairs ? Math.round((totalCorrect / totalPairs) * 100) : "—";
  const perfectPct = totalSessions ? Math.round((perfectCount / totalSessions) * 100) : "—";
  const failedPct = totalSessions
    ? Math.round(((totalSessions - perfectCount) / totalSessions) * 100)
    : "—";
  const avgTime = totalSessions
    ? formatTime(Math.round(history.reduce((s, e) => s + e.time, 0) / totalSessions))
    : "—";
  const avgPct = totalSessions
    ? Math.round(
        history.reduce((s, e) => s + (e.correct / e.total) * 100, 0) / totalSessions,
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
      <span class="hist-mode">${modeLabel[e.mode] || e.mode}</span>
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

    <p class="help-intro">Aplikacja trenuje zapamiętywanie par liter używanych przy układaniu kostki Rubika bez patrzenia (BLD). Dla parity przyjęto technikę <a href="https://youtu.be/RpFIbrQIPOg?si=R6PnktE88SH7c7V5" target="_blank" rel="noopener" style="color:inherit;font-weight:600;text-decoration:none">memo swap</a>, stąd zawsze parzysta liczba krawędzi, zaś w 50% rogi są nieparzyste.</p>

    <div class="field-label">Rogi i krawędzie</div>
    <p class="help-text">Kostka ma dwa rodzaje klocków — rogi (3 naklejki) i krawędzie (2 naklejki). Trenujesz je osobno lub razem. Krawędzie w aplikacji są zawsze parzyste ze względu na <a href="https://youtu.be/RpFIbrQIPOg?si=R6PnktE88SH7c7V5" target="_blank" rel="noopener" style="color:inherit;font-weight:600;text-decoration:none">memo swap</a>. Przy rogach może pojawić się samotna litera. To parity.</p>

    <div class="field-label">Jak wygląda gra</div>
    <ol class="help-steps">
      <li>Wybierz tryb i liczbę par</li>
      <li>Zapamiętaj wylosowane pary liter — masz tyle czasu ile potrzebujesz</li>
      <li>Naciśnij <strong>STOP</strong> i wpisz pary z pamięci</li>
      <li>Sprawdź wynik</li>
    </ol>

    <div class="field-label">Skróty klawiszowe</div>
    <div class="help-keys">
      <div class="help-key-row"><kbd>litera</kbd><span>wpisz i przeskocz dalej</span></div>
      <div class="help-key-row"><kbd>Backspace</kbd><span>usuń / cofnij kursor</span></div>
      <div class="help-key-row"><kbd>Spacja</kbd><span>pomiń parę</span></div>
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
      <button class="btn-schema-del" data-stype="${stype}" data-gidx="${gidx}" title="Usuń grupę">×</button>
    </div>`;
  };

  const cornerRows = state.settingsCorners.map((g, i) => groupRow(g, "corner", i)).join("");
  const edgeRows = state.settingsEdges.map((g, i) => groupRow(g, "edge", i)).join("");

  return `<div class="screen"><div class="card wide">
    <div class="top-bar">
      <button class="btn-config-top" id="btn-settings-back">←</button>
      <span class="phase-title">Schemat liter</span>
      <span></span>
    </div>
    <p class="schema-intro">Każda grupa to jeden klocek kostki — róg ma 3 strony (3 litery), krawędź 2 strony (2 litery). Każda litera może wystąpić tylko raz wśród rogów i tylko raz wśród krawędzi.</p>
    <div class="field-label">Rogi <span class="schema-type-hint">3 litery na kawałek</span></div>
    <div class="schema-list">${cornerRows}</div>
    <button class="btn-schema-add" data-stype="corner">+ Dodaj grupę rogów</button>
    <div class="field-label">Krawędzie <span class="schema-type-hint">2 litery na kawałek</span></div>
    <div class="schema-list">${edgeRows}</div>
    <button class="btn-schema-add" data-stype="edge">+ Dodaj grupę krawędzi</button>
    ${state.settingsError ? `<div class="schema-error">${state.settingsError}</div>` : ""}
    <div class="btn-row">
      <button class="btn-secondary" id="btn-schema-reset">Przywróć domyślne</button>
      <button class="btn-primary" id="btn-schema-save">Zapisz →</button>
    </div>
  </div></div>`;
}
