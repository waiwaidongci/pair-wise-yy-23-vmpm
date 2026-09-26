// 练习流程冒烟测试：用 fake-indexeddb + esbuild 直接跑 TS 源码，
// 验证 草稿→逐题作答→中途退出→续答→整组提交→错题本→进度 的完整闭环。
import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

const root = dirname(fileURLToPath(import.meta.url));
const out = await fs.mkdtemp(join(os.tmpdir(), "bt-smoke-"));
const entry = join(out, "entry.mjs");

const autoPath = pathToFileURL(join(root, "node_modules", "fake-indexeddb", "auto", "index.mjs")).href;
const keyRangePath = pathToFileURL(join(root, "node_modules", "fake-indexeddb", "build", "esm", "FDBKeyRange.js")).href;
const shim = `
await import(${JSON.stringify(autoPath)});
const _fdb = await import(${JSON.stringify(keyRangePath)});
if (!globalThis.IDBKeyRange) globalThis.IDBKeyRange = _fdb.default;
`;

await build({
  entryPoints: [join(root, "smoke", "scenario.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: entry,
  banner: { js: shim },
  define: {
    "import.meta.env.VITE_API_BASE": '"/api"',
    "import.meta.env.VITE_LOG_LEVEL": '"warn"',
    "import.meta.env.VITE_IDB_NAME": '"braille_smoke"',
    "import.meta.env.VITE_IDB_VERSION": '"1"'
  },
  logLevel: "warning"
});

await import(pathToFileURL(entry).href);
