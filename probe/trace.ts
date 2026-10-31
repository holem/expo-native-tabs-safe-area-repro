import type { EdgeInsets, Rect } from "react-native-safe-area-context";

const startedAt = performance.now();
let sequence = 0;
let pendingRows: string[] = [];
const MAX_TRACE_ROWS = 100_000;
let droppedRows = 0;
let rendererTraceUntil = -Infinity;
const rendererRoots = new WeakMap<object, number>();
let nextRendererRoot = 0;
const insetsObjects = new WeakMap<object, number>();
let nextInsetsObject = 0;

export function insetsObjectId(insets: object | null) {
  if (insets === null) return null;
  let id = insetsObjects.get(insets);
  if (id === undefined) {
    id = ++nextInsetsObject;
    insetsObjects.set(insets, id);
  }
  return id;
}

export function trace(tab: string, event: string, data: object = {}, jsNow = performance.now()) {
  const seq = ++sequence;
  if (pendingRows.length >= MAX_TRACE_ROWS) {
    droppedRows++;
    return seq;
  }
  pendingRows.push(
    JSON.stringify({
      seq,
      ms: Math.round((jsNow - startedAt) * 100) / 100,
      jsNow,
      tab,
      event,
      ...data,
    }),
  );
  return seq;
}

export function dumpTrace() {
  const rows = pendingRows;
  pendingRows = [];
  for (const row of rows) console.log("[tabs-probe]", row);
  if (droppedRows > 0) {
    console.log("[tabs-probe]", JSON.stringify({ seq: ++sequence, jsNow: performance.now(), tab: "trace", event: "trace-buffer-drop", droppedRows, limit: MAX_TRACE_ROWS }));
    droppedRows = 0;
  }
  return rows.length;
}

const probeGlobal = globalThis as typeof globalThis & {
  nativeFabricUIManager?: {
    unstable_getCurrentEventPriority?: () => number;
    unstable_DefaultEventPriority?: number;
    unstable_DiscreteEventPriority?: number;
    unstable_ContinuousEventPriority?: number;
    unstable_IdleEventPriority?: number;
  };
  __RNC42486Trace?: (data: {
    event: string;
    providerId: string;
    jsNow: number;
    insets: EdgeInsets | null;
    frame: Rect;
    details?: Record<string, unknown>;
  }) => void;
  __RCT42486Trace?: ((event: string, data: Record<string, unknown>, jsNow?: number, root?: object) => void) & { enabled: boolean };
};

const rendererTrace = Object.assign((event: string, data: Record<string, unknown>, jsNow = performance.now(), root?: object) => {
  if (event === "dispatchEvent:start" && typeof data.topLevelType === "string" && data.topLevelType.toLowerCase().includes("insetschange")) {
    rendererTraceUntil = jsNow + 1000;
  }
  rendererTrace.enabled = jsNow <= rendererTraceUntil && pendingRows.length < MAX_TRACE_ROWS;
  if (!rendererTrace.enabled) return;
  let rootId: number | undefined;
  if (root !== undefined && root !== null && typeof root === "object") {
    rootId = rendererRoots.get(root);
    if (rootId === undefined) {
      rootId = ++nextRendererRoot;
      rendererRoots.set(root, rootId);
    }
  }
  trace("renderer", event, { ...data, rootId }, jsNow);
}, { enabled: false });
probeGlobal.__RCT42486Trace = rendererTrace;

probeGlobal.__RNC42486Trace = ({ event, providerId, jsNow, insets, frame, details }) => {
  if (event === "provider-event-received-js") {
    rendererTraceUntil = jsNow + 1000;
    rendererTrace.enabled = true;
  }
  const manager = probeGlobal.nativeFabricUIManager;
  const nativePriority = event === "provider-event-received-js" && typeof manager?.unstable_getCurrentEventPriority === "function"
    ? {
      current: manager.unstable_getCurrentEventPriority(),
      default: manager.unstable_DefaultEventPriority,
      discrete: manager.unstable_DiscreteEventPriority,
      continuous: manager.unstable_ContinuousEventPriority,
      idle: manager.unstable_IdleEventPriority,
    }
    : undefined;
  trace("provider", event, { providerId, insetsObjectId: insetsObjectId(insets), insets, frame, nativePriority, ...details }, jsNow);
};
