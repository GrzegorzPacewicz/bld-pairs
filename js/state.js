const ls =
  typeof localStorage !== "undefined"
    ? localStorage
    : { getItem: () => null, setItem: () => {} };

export function isAnswerCorrect(pair, ans) {
  if (pair.length === 1) return ans[0] === pair[0];
  return (
    (ans[0] === pair[0] && ans[1] === pair[1]) ||
    (ans[0] === pair[1] && ans[1] === pair[0])
  );
}

export function allDone() {
  return state.answers.every(
    (ans, i) => state.skipped[i] || ans.every((v) => v),
  );
}

export function loadConfig() {
  try {
    const raw = ls.getItem("bld-config");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig() {
  ls.setItem(
    "bld-config",
    JSON.stringify({
      mode: state.mode,
      cornerCount: state.cornerCount,
      edgeCount: state.edgeCount,
      cubeType: state.cubeType,
      is4BLD: state.is4BLD,
      mode4BLD: state.mode4BLD,
      wingsCount: state.wingsCount,
      centersCount: state.centersCount,
      // 5BLD
      is5BLD: state.is5BLD,
      mode5BLD: state.mode5BLD,
      wingsCount5: state.wingsCount5,
      midgesCount: state.midgesCount,
      tcentersCount: state.tcentersCount,
      xcentersCount: state.xcentersCount,
    }),
  );
}

export function loadHistory() {
  try {
    return JSON.parse(ls.getItem("bld-history") || "[]");
  } catch {
    return [];
  }
}

export function removeLastHistory() {
  const history = loadHistory();
  if (history.length === 0) return;
  history.shift();
  ls.setItem("bld-history", JSON.stringify(history));
}

export function saveToHistory() {
  if (state.sessionSaved) return;
  state.sessionSaved = true;
  const ap = state.session.answerPairs;
  let correct = 0;
  let skipped = 0;
  ap.forEach(({ pair }, i) => {
    if (state.skipped[i]) {
      skipped++;
      return;
    }
    if (isAnswerCorrect(pair, state.answers[i])) correct++;
  });
  const entry = {
    ts: Date.now(),
    mode: state.is5BLD ? state.mode5BLD : state.is4BLD ? state.mode4BLD : state.mode,
    is4BLD: state.is4BLD,
    is5BLD: state.is5BLD,
    cubeType: state.cubeType,
    total: ap.length,
    correct,
    skipped,
    time: state.memTime,
  };
  const history = loadHistory();
  history.unshift(entry);
  ls.setItem("bld-history", JSON.stringify(history.slice(0, 200)));
}

const _saved = loadConfig();
const _cubeType = _saved.cubeType ?? "3style";
export const state = {
  phase: "config",
  mode: _saved.mode ?? "mixed",
  cornerCount: _saved.cornerCount ?? "?",
  edgeCount: _saved.edgeCount ?? "?",
  // Cube type: "3op" | "3style" | "4bld" | "5bld"
  cubeType: _cubeType,
  // 4BLD
  is4BLD: _cubeType === "4bld",
  mode4BLD: _saved.mode4BLD ?? "mixed",
  wingsCount: _saved.wingsCount ?? "?",
  centersCount: _saved.centersCount ?? "?",
  // 5BLD
  is5BLD: _cubeType === "5bld",
  mode5BLD: _saved.mode5BLD ?? "mixed",
  wingsCount5: _saved.wingsCount5 ?? "?",
  midgesCount: _saved.midgesCount ?? "?",
  tcentersCount: _saved.tcentersCount ?? "?",
  xcentersCount: _saved.xcentersCount ?? "?",
  // session
  session: null,
  memTime: 0,
  answers: [],
  skipped: [],
  timerInterval: null,
  sessionSaved: false,
  settingsCorners: null,
  settingsEdges: null,
  settingsError: null,
  // 4BLD settings
  settings4Corners: null,
  settings4Wings: null,
  settings4Centers: null,
  // 5BLD settings
  settings5Corners: null,
  settings5Wings: null,
  settings5Midges: null,
  settings5Tcenters: null,
  settings5Xcenters: null,
};
