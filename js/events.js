import { state, saveConfig, saveToHistory, allDone } from "./state.js";
import {
  CORNERS, EDGES, setCorners, setEdges,
  validateSchema, saveSchema,
  DEFAULT_CORNERS, DEFAULT_EDGES,
  CORNERS_4BLD, WINGS, CENTERS,
  setCorners4BLD, setWings, setCenters,
  validateSchema4BLD, saveSchema4BLD,
  DEFAULT_CORNERS_4BLD, DEFAULT_WINGS, DEFAULT_CENTERS,
} from "./schema.js";
import { generateSession, generate4BLDSession } from "./generator.js";
import { render } from "./render.js";
import { startTimer, stopTimer } from "./timer.js";

function initSessionState() {
  state.memTime = 0;
  state.answers = state.session.answerPairs.map(({ pair }) =>
    pair.length === 1 ? [""] : ["", ""],
  );
  state.skipped = Array(state.session.answerPairs.length).fill(false);
  state.sessionSaved = false;
}

function launchMemorize() {
  state.phase = "memorize";
  render();
  startTimer();
}

export function bindEvents() {
  // Cube toggle (3x3 / 4x4)
  document.querySelectorAll(".cube-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.is4BLD = btn.dataset.cube === "4x4";
      saveConfig();
      render();
    });
  });

  // 3x3 mode buttons
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      saveConfig();
      render();
    });
  });

  // 4BLD mode buttons
  document.querySelectorAll(".mode4-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode4BLD = btn.dataset.mode4;
      saveConfig();
      render();
    });
  });

  // 3x3 count buttons
  document.querySelectorAll(".count-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.count === "?" ? "?" : parseInt(btn.dataset.count);
      if (btn.dataset.type === "corner") state.cornerCount = val;
      else state.edgeCount = val;
      saveConfig();
      render();
    });
  });

  // 4BLD count buttons (corners, wings, centers)
  document.querySelectorAll(".count4-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.count === "?" ? "?" : parseInt(btn.dataset.count);
      if (btn.dataset.type === "corner") state.cornerCount = val;
      else if (btn.dataset.type === "wings") state.wingsCount = val;
      else if (btn.dataset.type === "centers") state.centersCount = val;
      saveConfig();
      render();
    });
  });

  const btnStart = document.getElementById("btn-start");
  if (btnStart)
    btnStart.addEventListener("click", () => {
      if (state.is4BLD) {
        state.session = generate4BLDSession(state.mode4BLD, state.cornerCount, state.wingsCount, state.centersCount);
      } else {
        state.session = generateSession(state.mode, state.cornerCount, state.edgeCount);
      }
      initSessionState();
      launchMemorize();
    });

  const btnCancel = document.getElementById("btn-cancel");
  if (btnCancel)
    btnCancel.addEventListener("click", () => {
      stopTimer();
      state.phase = "config";
      render();
    });

  const btnStop = document.getElementById("btn-stop");
  if (btnStop) {
    btnStop.addEventListener("click", () => {
      stopTimer();
      state.phase = "answer";
      render();
      focusFirst();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === " " && state.phase === "memorize") {
        e.preventDefault();
        stopTimer();
        state.phase = "answer";
        render();
        focusFirst();
      }
    });
  }

  const count = state.session?.answerPairs?.length || 0;
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < 2; col++) {
      const inp = document.getElementById(`inp-${row}-${col}`);
      if (!inp) continue;

      inp.addEventListener("input", (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-ZŁ]/g, "").slice(0, 1);
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

  const btnCheck = document.getElementById("btn-check");
  if (btnCheck)
    btnCheck.addEventListener("click", () => {
      saveToHistory();
      state.phase = "result";
      render();
    });

  const btnConfig = document.getElementById("btn-config");
  if (btnConfig)
    btnConfig.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnRetry = document.getElementById("btn-retry");
  if (btnRetry)
    btnRetry.addEventListener("click", () => {
      initSessionState();
      launchMemorize();
    });

  const btnNew = document.getElementById("btn-new");
  if (btnNew)
    btnNew.addEventListener("click", () => {
      if (state.is4BLD) {
        state.session = generate4BLDSession(state.mode4BLD, state.cornerCount, state.wingsCount, state.centersCount);
      } else {
        state.session = generateSession(state.mode, state.cornerCount, state.edgeCount);
      }
      initSessionState();
      launchMemorize();
    });

  const btnHistory = document.getElementById("btn-history");
  if (btnHistory)
    btnHistory.addEventListener("click", () => { state.phase = "history"; render(); });

  const btnBack = document.getElementById("btn-back");
  if (btnBack)
    btnBack.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnReset = document.getElementById("btn-reset");
  if (btnReset)
    btnReset.addEventListener("click", () => {
      if (confirm("Usunąć całą historię?")) {
        localStorage.removeItem("bld-history");
        render();
      }
    });

  const btnHelp = document.getElementById("btn-help");
  if (btnHelp)
    btnHelp.addEventListener("click", () => { state.phase = "help"; render(); });

  const btnHelpBack = document.getElementById("btn-help-back");
  if (btnHelpBack)
    btnHelpBack.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnHelpStart = document.getElementById("btn-help-start");
  if (btnHelpStart)
    btnHelpStart.addEventListener("click", () => { state.phase = "config"; render(); });

  // 3x3 settings
  const btnSettings = document.getElementById("btn-settings");
  if (btnSettings)
    btnSettings.addEventListener("click", () => {
      if (state.is4BLD) {
        state.settings4Corners = CORNERS_4BLD.map((g) => [...g]);
        state.settings4Wings = WINGS.map(g => g[0]);
        state.settings4Centers = CENTERS.map(g => g[0]);
        state.settingsError = null;
        state.phase = "settings4";
      } else {
        state.settingsCorners = CORNERS.map((g) => [...g]);
        state.settingsEdges = EDGES.map((g) => [...g]);
        state.settingsError = null;
        state.phase = "settings";
      }
      render();
    });

  const btnSettingsBack = document.getElementById("btn-settings-back");
  if (btnSettingsBack)
    btnSettingsBack.addEventListener("click", () => { state.phase = "config"; render(); });

  // 3x3 schema inputs
  document.querySelectorAll(".schema-li:not(.schema-li4)").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const val = e.target.value.toUpperCase().replace(/[^A-ZŁ]/g, "").slice(0, 1);
      e.target.value = val;
      const stype = inp.dataset.stype;
      const gidx = parseInt(inp.dataset.gidx);
      const cidx = parseInt(inp.dataset.cidx);
      if (stype === "corner") state.settingsCorners[gidx][cidx] = val;
      else if (stype === "corner4") state.settings4Corners[gidx][cidx] = val;
      else state.settingsEdges[gidx][cidx] = val;
    });
  });

  // 4BLD schema inputs (wings, centers)
  document.querySelectorAll(".schema-li4").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const val = e.target.value.toUpperCase().replace(/[^A-ZŁ]/g, "").slice(0, 1);
      e.target.value = val;
      const stype = inp.dataset.stype;
      const idx = parseInt(inp.dataset.idx);
      if (stype === "wings") state.settings4Wings[idx] = val;
      else if (stype === "centers") state.settings4Centers[idx] = val;
    });
  });

  document.querySelectorAll(".btn-schema-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stype = btn.dataset.stype;
      const gidx = parseInt(btn.dataset.gidx);
      if (stype === "corner") state.settingsCorners.splice(gidx, 1);
      else if (stype === "corner4") state.settings4Corners.splice(gidx, 1);
      else state.settingsEdges.splice(gidx, 1);
      render();
    });
  });

  document.querySelectorAll(".btn-schema-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.stype === "corner") state.settingsCorners.push(["", "", ""]);
      else if (btn.dataset.stype === "corner4") state.settings4Corners.push(["", "", ""]);
      else state.settingsEdges.push(["", ""]);
      render();
    });
  });

  const btnSchemaReset = document.getElementById("btn-schema-reset");
  if (btnSchemaReset)
    btnSchemaReset.addEventListener("click", () => {
      state.settingsCorners = DEFAULT_CORNERS.map((g) => [...g]);
      state.settingsEdges = DEFAULT_EDGES.map((g) => [...g]);
      state.settingsError = null;
      render();
    });

  const btnSchemaSave = document.getElementById("btn-schema-save");
  if (btnSchemaSave)
    btnSchemaSave.addEventListener("click", () => {
      const error = validateSchema(state.settingsCorners, state.settingsEdges);
      if (error) { state.settingsError = error; render(); return; }
      setCorners(state.settingsCorners.map((g) => [...g]));
      setEdges(state.settingsEdges.map((g) => [...g]));
      saveSchema(CORNERS, EDGES);
      state.settingsError = null;
      state.phase = "config";
      render();
    });

  // 4BLD settings
  const btnSettings4Back = document.getElementById("btn-settings4-back");
  if (btnSettings4Back)
    btnSettings4Back.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnSchema4Reset = document.getElementById("btn-schema4-reset");
  if (btnSchema4Reset)
    btnSchema4Reset.addEventListener("click", () => {
      state.settings4Corners = DEFAULT_CORNERS_4BLD.map((g) => [...g]);
      state.settings4Wings = [...DEFAULT_WINGS];
      state.settings4Centers = [...DEFAULT_CENTERS];
      state.settingsError = null;
      render();
    });

  const btnSchema4Save = document.getElementById("btn-schema4-save");
  if (btnSchema4Save)
    btnSchema4Save.addEventListener("click", () => {
      const error = validateSchema4BLD(state.settings4Corners, state.settings4Wings, state.settings4Centers);
      if (error) { state.settingsError = error; render(); return; }
      setCorners4BLD(state.settings4Corners.map((g) => [...g]));
      setWings([...state.settings4Wings]);
      setCenters([...state.settings4Centers]);
      saveSchema4BLD(CORNERS_4BLD, state.settings4Wings, state.settings4Centers);
      state.settingsError = null;
      state.phase = "config";
      render();
    });
}

export function skipRow(row) {
  state.skipped[row] = true;
  state.answers[row] = ["", ""];
  render();
  focusNextRow(row);
}

export function focusInp(row, col) {
  const el = document.getElementById(`inp-${row}-${col}`);
  if (el) el.focus();
}

export function focusNextRow(row) {
  const count = state.session?.answerPairs?.length || 0;
  let next = row + 1;
  while (next < count && state.skipped[next]) next++;
  setTimeout(() => focusInp(next, 0), 0);
}

export function focusFirst() {
  setTimeout(() => focusInp(0, 0), 50);
}

export function updateCheckBtn() {
  const btn = document.getElementById("btn-check");
  if (!btn) return;
  btn.disabled = !allDone();
  if (allDone())
    setTimeout(() => {
      saveToHistory();
      state.phase = "result";
      render();
    }, 400);
}
