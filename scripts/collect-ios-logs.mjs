import { execFileSync, spawnSync } from "node:child_process";
import { closeSync, copyFileSync, mkdirSync, openSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

try {
  const simulator = process.env.REPRO_SIMULATOR ?? "booted";
  const bundle = process.env.REPRO_BUNDLE_ID ?? "dev.repro.expo42486";
  const window = process.env.REPRO_LOG_WINDOW ?? "10m";
  if (!/^\d+[smhd]$/.test(window)) throw new Error("REPRO_LOG_WINDOW must be a duration such as 10m or 1h.");

  const data = execFileSync("xcrun", ["simctl", "get_app_container", simulator, bundle, "data"], {
    encoding: "utf8",
    timeout: 15_000,
  }).trim();
  const source = path.join(data, "Documents", "native-tabs-42486");
  const files = readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^frames-\d+-.*\.jsonl$/.test(entry.name))
    .map((entry) => ({ name: entry.name, modified: statSync(path.join(source, entry.name)).mtimeMs }))
    .sort((a, b) => b.modified - a.modified);
  if (files.length === 0) throw new Error("No frame capture yet. Complete the tab sequence and wait four seconds.");
  const manifest = JSON.parse(readFileSync(path.join(source, files[0].name), "utf8").split("\n", 1)[0]);
  const pid = manifest.pid;
  if (manifest.event !== "frame-trace-manifest" || !Number.isSafeInteger(pid) || pid <= 0) {
    throw new Error("The latest frame capture is not ready. Wait a moment and retry.");
  }

  const destination = path.resolve("logs", String(pid));
  const frames = path.join(destination, "frames");
  mkdirSync(frames, { recursive: true });
  let count = 0;
  for (const file of files.filter((entry) => entry.name.startsWith(`frames-${pid}-`))) {
    copyFileSync(path.join(source, file.name), path.join(frames, file.name));
    count++;
  }
  const nativeFile = path.join(destination, "native.json");
  const fd = openSync(nativeFile, "w");
  try {
    const result = spawnSync("xcrun", [
      "simctl", "spawn", simulator, "log", "show", "--last", window, "--style", "json",
      "--predicate", `processIdentifier == ${pid} AND composedMessage BEGINSWITH "[native-tabs-42486]"`,
    ], { encoding: "utf8", stdio: ["ignore", fd, "pipe"], timeout: 30_000 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || "Simulator log collection failed.");
  } finally {
    closeSync(fd);
  }
  console.log(`Saved ${count} frame files and native logs for PID ${pid} in ${destination}`);
  console.log("JS/UI records are in logs/metro.log after pressing Dump trace.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
