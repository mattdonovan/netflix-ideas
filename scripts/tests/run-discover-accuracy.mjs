// Bundles the accuracy checks with esbuild (Vite's own) and runs them in Node.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", ".cache", "discover-accuracy.mjs");
await build({
  entryPoints: [path.join(here, "discover-accuracy.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  logLevel: "error",
  alias: { "@": path.join(here, "..", "..", "src") },
  // The UI bundle pulls in React/MUI; only the logic is under test.
  external: ["react", "react-dom", "@mui/*", "@emotion/*", "@anthropic-ai/sdk"],
  define: { "import.meta.env.PROD": "false", "import.meta.env.DEV": "false", "import.meta.env.VITE_ANTHROPIC_API_KEY": "undefined" },
});
await import(out);
