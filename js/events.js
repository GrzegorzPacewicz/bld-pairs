import { state, saveConfig, saveToHistory, allDone, removeLastHistory } from "./state.js";
import {
  CORNERS, EDGES, setCorners, setEdges,
  validateSchema, saveSchema,
  DEFAULT_CORNERS, DEFAULT_EDGES,
  CORNERS_4BLD, WINGS, CENTERS,
  setCorners4BLD, setWings, setCenters,
  validateSchema4BLD, saveSchema4BLD,
  DEFAULT_CORNERS_4BLD, DEFAULT_WINGS, DEFAULT_CENTERS,
  CORNERS_5BLD, WINGS_5BLD, MIDGES, TCENTERS, XCENTERS,
  setCorners5BLD, setWings5BLD, setMidges, setTcenters, setXcenters,
  validateSchema5BLD, saveSchema5BLD,
  DEFAULT_CORNERS_5BLD, DEFAULT_WINGS_5BLD, DEFAULT_MIDGES, DEFAULT_TCENTERS, DEFAULT_XCENTERS,
} from "./schema.js";
import { generateSession } from "./generator3bld.js";
import { generate4BLDSession } from "./generator4bld.js";
import { generate5BLDSession } from "./generator5bld.js";
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
  // Cube toggle (3OP / 3Style / 4BLD / 5BLD)
  document.querySelectorAll(".cube-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.cubeType = btn.dataset.cube;
      state.is4BLD = btn.dataset.cube === "4bld";
      state.is5BLD = btn.dataset.cube === "5bld";
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

  // 5BLD mode buttons
  document.querySelectorAll(".mode5-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode5BLD = btn.dataset.mode5;
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

  // 5BLD count buttons
  document.querySelectorAll(".count5-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.count === "?" ? "?" : parseInt(btn.dataset.count);
      if (btn.dataset.type === "corner") state.cornerCount = val;
      else if (btn.dataset.type === "wings5") state.wingsCount5 = val;
      else if (btn.dataset.type === "midges") state.midgesCount = val;
      else if (btn.dataset.type === "tcenters") state.tcentersCount = val;
      else if (btn.dataset.type === "xcenters") state.xcentersCount = val;
      saveConfig();
      render();
    });
  });

  const btnStart = document.getElementById("btn-start");
  if (btnStart)
    btnStart.addEventListener("click", () => {
      if (state.is5BLD) {
        state.session = generate5BLDSession(state.mode5BLD, state.cornerCount, state.wingsCount5, state.midgesCount, state.tcentersCount, state.xcentersCount);
      } else if (state.is4BLD) {
        state.session = generate4BLDSession(state.mode4BLD, state.cornerCount, state.wingsCount, state.centersCount);
      } else {
        const is3OP = state.cubeType === "3op";
        state.session = generateSession(state.mode, state.cornerCount, state.edgeCount, is3OP);
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
      if (state.is5BLD) {
        state.session = generate5BLDSession(state.mode5BLD, state.cornerCount, state.wingsCount5, state.midgesCount, state.tcentersCount, state.xcentersCount);
      } else if (state.is4BLD) {
        state.session = generate4BLDSession(state.mode4BLD, state.cornerCount, state.wingsCount, state.centersCount);
      } else {
        const is3OP = state.cubeType === "3op";
        state.session = generateSession(state.mode, state.cornerCount, state.edgeCount, is3OP);
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

  const btnRemoveLast = document.getElementById("btn-remove-last");
  if (btnRemoveLast)
    btnRemoveLast.addEventListener("click", () => {
      removeLastHistory();
      render();
    });

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
      if (state.is5BLD) {
        state.settings5Corners = padGroups(CORNERS_5BLD.map((g) => [...g]), 7, 3);
        state.settings5Wings = padSingle(WINGS_5BLD.map((g) => [...g]), 23);
        state.settings5Midges = padGroups(MIDGES.map((g) => [...g]), 11, 2);
        state.settings5Tcenters = TCENTERS.map((g) => [...g]);
        state.settings5Xcenters = XCENTERS.map((g) => [...g]);
        state.settingsError = null;
        state.phase = "settings5";
      } else if (state.is4BLD) {
        state.settings4Corners = padGroups(CORNERS_4BLD.map((g) => [...g]), 7, 3);
        state.settings4Wings = padSingle(WINGS.map((g) => [...g]), 23);
        state.settings4Centers = CENTERS.map((g) => [...g]);
        state.settingsError = null;
        state.phase = "settings4";
      } else {
        state.settingsCorners = padGroups(CORNERS.map((g) => [...g]), 7, 3);
        state.settingsEdges = padGroups(EDGES.map((g) => [...g]), 11, 2);
        state.settingsError = null;
        state.phase = "settings";
      }
      render();
    });

  const btnSettingsBack = document.getElementById("btn-settings-back");
  if (btnSettingsBack)
    btnSettingsBack.addEventListener("click", () => { state.phase = "config"; render(); });

  // Schema group inputs (corners, edges, corner4) with auto-jump
  document.querySelectorAll(".schema-li:not(.schema-flat-li)").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-ZŁ]/g, "").slice(0, 1);
      const stype = inp.dataset.stype;
      const gidx = parseInt(inp.dataset.gidx);
      const cidx = parseInt(inp.dataset.cidx);

      if (val) {
        const letters = getSchemaLetters(stype);
        const flatIdx = stype === "edge" ? gidx * 2 + cidx : gidx * 3 + cidx;
        const isDupe = letters.some((l, i) => l === val && i !== flatIdx);
        if (isDupe) {
          val = "";
          e.target.classList.add("schema-dupe");
          setTimeout(() => e.target.classList.remove("schema-dupe"), 300);
        }
      }

      e.target.value = val;
      setSchemaGroupLetter(stype, gidx, cidx, val);

      if (val) {
        focusNextSchemaGroupInput(stype, gidx, cidx);
      }
    });

    inp.addEventListener("keydown", (e) => {
      const stype = inp.dataset.stype;
      const gidx = parseInt(inp.dataset.gidx);
      const cidx = parseInt(inp.dataset.cidx);

      if (e.key === "Backspace" && inp.value === "") {
        e.preventDefault();
        focusPrevSchemaGroupInput(stype, gidx, cidx);
      }
    });
  });

  // Schema flat inputs (wings, centers) with auto-jump
  document.querySelectorAll(".schema-flat-li").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-ZŁ]/g, "").slice(0, 1);
      const stype = inp.dataset.stype;
      const idx = parseInt(inp.dataset.idx);

      if (val) {
        const letters = getSchemaLetters(stype);
        const isDupe = letters.some((l, i) => l === val && i !== idx);
        if (isDupe) {
          val = "";
          e.target.classList.add("schema-dupe");
          setTimeout(() => e.target.classList.remove("schema-dupe"), 300);
        }
      }

      e.target.value = val;
      setSchemaLetter(stype, idx, val);

      if (val) {
        focusNextSchemaInput(stype, idx);
      }
    });

    inp.addEventListener("keydown", (e) => {
      const stype = inp.dataset.stype;
      const idx = parseInt(inp.dataset.idx);

      if (e.key === "Backspace") {
        if (inp.value === "" && idx > 0) {
          e.preventDefault();
          focusPrevSchemaInput(stype, idx);
        }
      }
    });
  });

  const btnSchemaReset = document.getElementById("btn-schema-reset");
  if (btnSchemaReset)
    btnSchemaReset.addEventListener("click", () => {
      state.settingsCorners = padGroups(DEFAULT_CORNERS.map((g) => [...g]), 7, 3);
      state.settingsEdges = padGroups(DEFAULT_EDGES.map((g) => [...g]), 11, 2);
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
      state.settings4Corners = padGroups(DEFAULT_CORNERS_4BLD.map((g) => [...g]), 7, 3);
      state.settings4Wings = DEFAULT_WINGS.map((l) => [l]);
      state.settings4Centers = DEFAULT_CENTERS.map((g) => [...g]);
      state.settingsError = null;
      render();
    });

  const btnSchema4Save = document.getElementById("btn-schema4-save");
  if (btnSchema4Save)
    btnSchema4Save.addEventListener("click", () => {
      const error = validateSchema4BLD(state.settings4Corners, state.settings4Wings, state.settings4Centers);
      if (error) { state.settingsError = error; render(); return; }
      setCorners4BLD(state.settings4Corners.map((g) => [...g]));
      const wingsFlat = state.settings4Wings.flat();
      setWings(wingsFlat);
      setCenters(state.settings4Centers.map((g) => [...g]));
      saveSchema4BLD(CORNERS_4BLD, wingsFlat, state.settings4Centers);
      state.settingsError = null;
      state.phase = "config";
      render();
    });

  // 5BLD settings
  const btnSettings5Back = document.getElementById("btn-settings5-back");
  if (btnSettings5Back)
    btnSettings5Back.addEventListener("click", () => { state.phase = "config"; render(); });

  const btnSchema5Reset = document.getElementById("btn-schema5-reset");
  if (btnSchema5Reset)
    btnSchema5Reset.addEventListener("click", () => {
      state.settings5Corners = padGroups(DEFAULT_CORNERS_5BLD.map((g) => [...g]), 7, 3);
      state.settings5Wings = DEFAULT_WINGS_5BLD.map((l) => [l]);
      state.settings5Midges = padGroups(DEFAULT_MIDGES.map((g) => [...g]), 11, 2);
      state.settings5Tcenters = DEFAULT_TCENTERS.map((g) => [...g]);
      state.settings5Xcenters = DEFAULT_XCENTERS.map((g) => [...g]);
      state.settingsError = null;
      render();
    });

  const btnSchema5Save = document.getElementById("btn-schema5-save");
  if (btnSchema5Save)
    btnSchema5Save.addEventListener("click", () => {
      const error = validateSchema5BLD(state.settings5Corners, state.settings5Wings, state.settings5Midges, state.settings5Tcenters, state.settings5Xcenters);
      if (error) { state.settingsError = error; render(); return; }
      setCorners5BLD(state.settings5Corners.map((g) => [...g]));
      const wingsFlat = state.settings5Wings.flat();
      setWings5BLD(wingsFlat);
      setMidges(state.settings5Midges.map((g) => [...g]));
      setTcenters(state.settings5Tcenters.map((g) => [...g]));
      setXcenters(state.settings5Xcenters.map((g) => [...g]));
      saveSchema5BLD(CORNERS_5BLD, wingsFlat, MIDGES, TCENTERS, XCENTERS);
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

function padGroups(groups, count, size) {
  const result = groups.map(g => [...g]);
  while (result.length < count) result.push(Array(size).fill(""));
  return result;
}

function padSingle(groups, count) {
  const result = groups.map(g => [...g]);
  while (result.length < count) result.push([""]);
  return result;
}

function getSchemaLetters(stype) {
  if (stype === "corner") return state.settingsCorners.flat();
  if (stype === "edge") return state.settingsEdges.flat();
  if (stype === "corner4") return state.settings4Corners.flat();
  if (stype === "wings") return state.settings4Wings.flat();
  if (stype === "centers4") return state.settings4Centers.flat();
  if (stype === "corner5") return state.settings5Corners.flat();
  if (stype === "wings5") return state.settings5Wings.flat();
  if (stype === "midges5") return state.settings5Midges.flat();
  if (stype === "tcenters5") return state.settings5Tcenters.flat();
  if (stype === "xcenters5") return state.settings5Xcenters.flat();
  return [];
}

function setSchemaGroupLetter(stype, gidx, cidx, val) {
  if (stype === "corner") state.settingsCorners[gidx][cidx] = val;
  else if (stype === "corner4") state.settings4Corners[gidx][cidx] = val;
  else if (stype === "edge") state.settingsEdges[gidx][cidx] = val;
  else if (stype === "centers4") state.settings4Centers[gidx][cidx] = val;
  else if (stype === "corner5") state.settings5Corners[gidx][cidx] = val;
  else if (stype === "midges5") state.settings5Midges[gidx][cidx] = val;
  else if (stype === "tcenters5") state.settings5Tcenters[gidx][cidx] = val;
  else if (stype === "xcenters5") state.settings5Xcenters[gidx][cidx] = val;
}

function setSchemaLetter(stype, idx, val) {
  if (stype === "wings") {
    while (state.settings4Wings.length <= idx) state.settings4Wings.push([""]);
    state.settings4Wings[idx][0] = val;
  } else if (stype === "wings5") {
    while (state.settings5Wings.length <= idx) state.settings5Wings.push([""]);
    state.settings5Wings[idx][0] = val;
  }
}

function getGroupSize(stype, gidx) {
  if (stype === "edge") return 2;
  if (stype === "midges5") return 2;
  if (stype === "centers4") {
    return state.settings4Centers[gidx]?.length || 4;
  }
  if (stype === "tcenters5") {
    return state.settings5Tcenters[gidx]?.length || 4;
  }
  if (stype === "xcenters5") {
    return state.settings5Xcenters[gidx]?.length || 4;
  }
  return 3;
}

function focusNextSchemaGroupInput(stype, gidx, cidx) {
  const groupSize = getGroupSize(stype, gidx);
  const nextCidx = cidx + 1;
  if (nextCidx < groupSize) {
    const next = document.querySelector(`.schema-li[data-stype="${stype}"][data-gidx="${gidx}"][data-cidx="${nextCidx}"]`);
    if (next) { next.focus(); next.select(); return; }
  }
  const nextGroup = document.querySelector(`.schema-li[data-stype="${stype}"][data-gidx="${gidx + 1}"][data-cidx="0"]`);
  if (nextGroup) { nextGroup.focus(); nextGroup.select(); }
}

function focusPrevSchemaGroupInput(stype, gidx, cidx) {
  if (cidx > 0) {
    const prev = document.querySelector(`.schema-li[data-stype="${stype}"][data-gidx="${gidx}"][data-cidx="${cidx - 1}"]`);
    if (prev) { prev.focus(); prev.select(); return; }
  }
  if (gidx > 0) {
    const prevGroupSize = getGroupSize(stype, gidx - 1);
    const prev = document.querySelector(`.schema-li[data-stype="${stype}"][data-gidx="${gidx - 1}"][data-cidx="${prevGroupSize - 1}"]`);
    if (prev) { prev.focus(); prev.select(); }
  }
}

function focusNextSchemaInput(stype, currentIdx) {
  const inputs = document.querySelectorAll(`.schema-flat-li[data-stype="${stype}"]`);
  const nextIdx = currentIdx + 1;
  if (nextIdx < inputs.length) {
    inputs[nextIdx].focus();
    inputs[nextIdx].select();
  }
}

function focusPrevSchemaInput(stype, currentIdx) {
  const inputs = document.querySelectorAll(`.schema-flat-li[data-stype="${stype}"]`);
  const prevIdx = currentIdx - 1;
  if (prevIdx >= 0) {
    inputs[prevIdx].focus();
    inputs[prevIdx].select();
  }
}
