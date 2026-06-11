const ls =
  typeof localStorage !== "undefined"
    ? localStorage
    : { getItem: () => null, setItem: () => {} };

export const BUILD = "v1.11";

export function formatTime(s) {
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}

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
    mode: state.mode,
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
  session: null,
  memTime: 0,
  answers: [],
  skipped: [],
  timerInterval: null,
  sessionSaved: false,
  settingsCorners: null,
  settingsEdges: null,
  settingsError: null,
};
