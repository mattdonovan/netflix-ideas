#!/usr/bin/env node
/**
 * build-idea — scaffold a new prototype into src/prototypes/<slug>/ and
 * register it on the picker + router via src/prototypes/registry.tsx.
 *
 * Usage:
 *   npm run build-idea -- --name=watch-party --title="Watch Party" --web-ui
 *   npm run build-idea -- --name=remote-tv --tv
 *   npm run build-idea -- --name=garden --glyph=🌱
 *
 * Flags:
 *   --name=<slug>     required. lowercase-dash slug. Becomes /<slug> route + directory.
 *   --title=<string>  optional. Picker label + headline. Defaults to a Title Cased --name.
 *   --glyph=<string>  optional. 1–2 chars rendered on the picker tile. Defaults to first letter.
 *   --web-ui          template: plain MUI page on Hawkins tokens (default).
 *   --tv              template: wrapped in TvFrame with safe-zone padding.
 *
 * Templates live in scripts/templates/<template>/. Add a new template by
 * dropping a directory there with .template files. Substitutions:
 *   {{PROTOTYPE_SLUG}}       the slug as passed
 *   {{PROTOTYPE_COMPONENT}}  PascalCase of slug — the React component name
 *   {{PROTOTYPE_TITLE}}      the title as passed (or derived)
 *   {{GENERATED_DATE}}       YYYY-MM-DD
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

const RESERVED_SLUGS = new Set([
  "", "channels", "experiments", "idea-hopper", "registry",
  "api", "assets", "static", "public",
]);

const SLUG_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 40;
const MIN_SLUG_LENGTH = 2;

function parseArgs(argv) {
  const out = { template: "web" };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--name=")) out.name = arg.slice("--name=".length);
    else if (arg.startsWith("--title=")) out.title = arg.slice("--title=".length);
    else if (arg.startsWith("--glyph=")) out.glyph = arg.slice("--glyph=".length);
    else if (arg === "--web-ui") out.template = "web";
    else if (arg === "--tv") out.template = "tv";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else {
      console.error(`Unknown arg: ${arg}`);
      process.exit(2);
    }
  }
  return out;
}

function printHelp() {
  console.log(readFileSync(__filename, "utf8")
    .split("\n")
    .slice(2, 27)
    .map((l) => l.replace(/^ \*\s?/, "").replace(/^\/\*\*?$/, ""))
    .join("\n"));
}

function toPascalCase(slug) {
  return slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
}

function toTitleCase(slug) {
  return slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
}

function validate(args) {
  if (!args.name) {
    console.error("Error: --name=<slug> is required.\n");
    printHelp();
    process.exit(2);
  }
  if (args.name.length < MIN_SLUG_LENGTH || args.name.length > MAX_SLUG_LENGTH) {
    console.error(`Error: --name must be ${MIN_SLUG_LENGTH}–${MAX_SLUG_LENGTH} characters.`);
    process.exit(2);
  }
  if (!SLUG_RE.test(args.name)) {
    console.error("Error: --name must be lowercase-dash-slug (e.g. 'watch-party'). Start with a letter; only a–z, 0–9, and dashes; no double-dashes.");
    process.exit(2);
  }
  if (RESERVED_SLUGS.has(args.name)) {
    console.error(`Error: '${args.name}' is reserved (collides with an existing route or directory).`);
    process.exit(2);
  }
  if (!existsSync(join(repoRoot, "scripts", "templates", args.template))) {
    console.error(`Error: template '${args.template}' not found at scripts/templates/${args.template}/.`);
    process.exit(2);
  }
  const targetDir = join(repoRoot, "src", "prototypes", args.name);
  if (existsSync(targetDir)) {
    console.error(`Error: src/prototypes/${args.name}/ already exists.`);
    process.exit(2);
  }
}

function substitute(text, vars) {
  return text
    .replaceAll("{{PROTOTYPE_SLUG}}", vars.slug)
    .replaceAll("{{PROTOTYPE_COMPONENT}}", vars.component)
    .replaceAll("{{PROTOTYPE_TITLE}}", vars.title)
    .replaceAll("{{GENERATED_DATE}}", vars.date);
}

function copyTemplate(args, vars) {
  const srcDir = join(repoRoot, "scripts", "templates", args.template);
  const dstDir = join(repoRoot, "src", "prototypes", args.name);
  mkdirSync(dstDir, { recursive: true });

  const files = readdirSync(srcDir);
  const written = [];
  for (const file of files) {
    if (!file.endsWith(".template")) continue;
    const targetName = file
      .replace(/\.template$/, "")
      .replace(/^Prototype\.tsx$/, `${vars.component}.tsx`)
      .replace(/^Prototype$/, vars.component);
    const srcPath = join(srcDir, file);
    const dstPath = join(dstDir, targetName);
    const content = substitute(readFileSync(srcPath, "utf8"), vars);
    writeFileSync(dstPath, content);
    written.push(`src/prototypes/${args.name}/${targetName}`);
  }
  return written;
}

function registerInRegistry(args, vars) {
  const path = join(repoRoot, "src", "prototypes", "registry.tsx");
  let content = readFileSync(path, "utf8");

  const importLine = `import { ${vars.component} } from "./${vars.slug}";`;
  const entry = `  { slug: ${JSON.stringify(vars.slug)}, label: ${JSON.stringify(vars.title)}, glyph: ${JSON.stringify(vars.glyph)}, Component: ${vars.component} },`;

  const importAnchor = "// SCRIPT ANCHOR: imports (do not remove — `npm run build-idea` inserts above this line)";
  const entryAnchor = "  // SCRIPT ANCHOR: entries (do not remove — `npm run build-idea` inserts above this line)";

  if (!content.includes(importAnchor) || !content.includes(entryAnchor)) {
    console.error("Error: anchors missing from src/prototypes/registry.tsx. Did you edit them out?");
    process.exit(1);
  }
  if (content.includes(importLine)) {
    console.error(`Error: '${vars.component}' already imported in registry.tsx — slug collision?`);
    process.exit(1);
  }
  content = content.replace(importAnchor, `${importLine}\n${importAnchor}`);
  content = content.replace(entryAnchor, `${entry}\n${entryAnchor}`);
  writeFileSync(path, content);
  return "src/prototypes/registry.tsx";
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  validate(args);

  const title = args.title ?? toTitleCase(args.name);
  const component = toPascalCase(args.name);
  const glyph = args.glyph ?? title[0].toUpperCase();
  const date = new Date().toISOString().slice(0, 10);
  const vars = { slug: args.name, component, title, glyph, date };

  const written = copyTemplate(args, vars);
  const registryPath = registerInRegistry(args, vars);

  console.log(`\n✓ Scaffolded '${args.name}' (${args.template} template)\n`);
  for (const f of written) console.log(`  + ${f}`);
  console.log(`  ~ ${registryPath}`);
  console.log(`\n  Route:  http://localhost:5173/${args.name}`);
  console.log(`  Picker: a "${glyph}" tile labeled "${title}"`);
  console.log(`\n  Next: npm run dev`);
  console.log(`        Edit src/prototypes/${args.name}/${component}.tsx to replace the scaffold.\n`);
}

main();
