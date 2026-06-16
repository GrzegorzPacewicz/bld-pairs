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
      is4BLD: state.is4BLD,
      mode4BLD: state.mode4BLD,
      wingsCount: state.wingsCount,
      centersCount: state.centersCount,
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
    mode: state.is4BLD ? state.mode4BLD : state.mode,
    is4BLD: state.is4BLD,
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
export const state = {
  phase: "config",
  mode: _saved.mode ?? "mixed",
  cornerCount: _saved.cornerCount ?? "?",
  edgeCount: _saved.edgeCount ?? "?",
  // 4BLD
  is4BLD: _saved.is4BLD ?? false,
  mode4BLD: _saved.mode4BLD ?? "mixed",
  wingsCount: _saved.wingsCount ?? "?",
  centersCount: _saved.centersCount ?? "?",
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
};
