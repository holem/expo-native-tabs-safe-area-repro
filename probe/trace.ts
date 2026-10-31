const startedAt = performance.now();
const MAX_ROWS = 1000;
let sequence = 0;
let rows: string[] = [];
let dropped = 0;

// Capture snapshots in memory; write to Metro only when Dump trace is pressed.
export function trace(tab: string, event: string, data: object = {}) {
  const seq = ++sequence;
  if (rows.length >= MAX_ROWS) {
    dropped++;
    return;
  }
  rows.push(JSON.stringify({ seq, ms: performance.now() - startedAt, tab, event, ...data }));
}

export function dumpTrace() {
  const captured = rows;
  rows = [];
  for (const row of captured) console.log("[tabs-probe]", row);
  if (dropped > 0) {
    console.log("[tabs-probe]", JSON.stringify({ event: "buffer-drop", dropped }));
    dropped = 0;
  }
}
