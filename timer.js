import { state, fmt } from "./state.js";

export function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    state.memTime++;
    const el = document.getElementById("timer-display");
    if (el) el.textContent = fmt(state.memTime);
  }, 1000);
}

export function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}
