import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { dumpTrace, trace } from "./trace";

type UiCapture = { rows: string[]; total: number; dropped: number; errors: number; steadyMs: number };
type UiProbeGlobal = typeof globalThis & {
  __RNC42486UIState?: { rows: string[]; total: number; dropped: number; errors: number };
  __RNC42486UITrace?: (event: string, data?: Record<string, unknown>) => void;
  __RNC42486UITake?: () => UiCapture;
};

scheduleOnUI(() => {
  "worklet";
  const target = globalThis as UiProbeGlobal;
  target.__RNC42486UIState = { rows: [], total: 0, dropped: 0, errors: 0 };
  target.__RNC42486UITrace = (event, data = {}) => {
    "worklet";
    const state = (globalThis as UiProbeGlobal).__RNC42486UIState;
    if (state === undefined) return;
    const seq = ++state.total;
    if (state.rows.length >= 50_000) {
      state.dropped++;
      return;
    }
    try {
      state.rows.push(JSON.stringify({ seq, event, steadyMs: performance.now(), data }));
    } catch {
      state.errors++;
    }
  };
  target.__RNC42486UITake = () => {
    "worklet";
    const state = (globalThis as UiProbeGlobal).__RNC42486UIState;
    if (state === undefined) return { rows: [], total: 0, dropped: 0, errors: 1, steadyMs: performance.now() };
    const capture = { ...state, steadyMs: performance.now() };
    state.rows = [];
    state.total = state.dropped = state.errors = 0;
    return capture;
  };
});

function receiveUiTrace(capture: UiCapture) {
  const receivedRNMs = performance.now();
  for (const raw of capture.rows) {
    const row = JSON.parse(raw) as { seq: number; event: string; steadyMs: number; data: Record<string, unknown> };
    trace("ui", row.event, { uiSeq: row.seq, steadyMs: row.steadyMs, details: row.data, receivedRNMs }, receivedRNMs);
  }
  trace("ui", "ui-buffer-summary", {
    total: capture.total,
    captured: capture.rows.length,
    dropped: capture.dropped,
    serializationErrors: capture.errors,
    limit: 50_000,
    steadyMs: capture.steadyMs,
    receivedRNMs,
  }, receivedRNMs);
  dumpTrace();
}

export function requestDumpTrace() {
  scheduleOnUI(() => {
    "worklet";
    const capture = (globalThis as UiProbeGlobal).__RNC42486UITake?.();
    scheduleOnRN(receiveUiTrace, capture ?? { rows: [], total: 0, dropped: 0, errors: 1, steadyMs: performance.now() });
  });
}
