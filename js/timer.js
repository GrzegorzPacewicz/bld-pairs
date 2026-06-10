import { state } from "./state.js";

export function formatTime(s) {
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}

export function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    state.memTime++;
    const el = document.getElementById("timer-display");
    if (el) el.textContent = formatTime(state.memTime);
  }, 1000);
}

export function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}
