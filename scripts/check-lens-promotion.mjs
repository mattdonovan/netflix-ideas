#!/usr/bin/env node
// Scans reviews/*.md and reports per-lens signals for promoting a lens to a skill.
// See `context/review-lenses.md` -> "Promoting a lens to a skill" for the criteria.
// Run: npm run review:check

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const reviewsDir = path.join(repoRoot, 'reviews');
const lensesFile = path.join(repoRoot, 'context', 'review-lenses.md');

const ANCHOR_LENSES = [
  'Frank Chimero',
  'Josh Mateo',
  'Niyati Gupta',
  'Diana Lu',
  'Matt D. Smith',
];

const TRACK_RECORD_THRESHOLD = 4;
const SIT_OUT_STREAK_THRESHOLD = 3;
const SECTION_LINE_THRESHOLD = 80;
const FILE_LINE_THRESHOLD = 400;

function getReviewFiles() {
  if (!fs.existsSync(reviewsDir)) return [];
  return fs
    .readdirSync(reviewsDir)
    .filter((f) => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f))
    .sort()
    .map((f) => path.join(reviewsDir, f));
}

function parseHeadings(content, levels = [2, 3, 4]) {
  const lines = content.split('\n');
  const hashPattern = `^(${levels.map((l) => `#{${l}}`).join('|')}) `;
  const re = new RegExp(hashPattern);
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      headings.push({ index: i, heading: lines[i].replace(/^#+\s+/, '').trim() });
    }
  }
  return { lines, headings };
}

function sectionBody(content, headingName, levels) {
  const { lines, headings } = parseHeadings(content, levels);
  const idx = headings.findIndex((h) => h.heading === headingName);
  if (idx === -1) return null;
  const start = headings[idx].index;
  const end = idx + 1 < headings.length ? headings[idx + 1].index : lines.length;
  return { body: lines.slice(start + 1, end).join('\n'), lineCount: end - start };
}

// 'carry' | 'sit-out' | 'graduate' | 'missing'
function classifyLensInReview(content, lens) {
  const section = sectionBody(content, lens, [2, 3, 4]);
  if (section === null) return 'missing';
  const body = section.body;
  if (/^\s*-\s*(\*\*)?Graduate/im.test(body)) return 'graduate';
  if (/^\s*-\s*(\*\*)?Sit[\s-]?out/im.test(body)) return 'sit-out';
  return body.trim().length > 0 ? 'carry' : 'missing';
}

function collectLensTimelines() {
  const reviewFiles = getReviewFiles();
  const reviews = reviewFiles.map((f) => ({
    file: path.basename(f),
    content: fs.readFileSync(f, 'utf-8'),
  }));

  const stats = {};
  for (const lens of ANCHOR_LENSES) {
    const timeline = reviews.map((r) => ({
      file: r.file,
      classification: classifyLensInReview(r.content, lens),
    }));
    const appearances = timeline.filter((t) => t.classification !== 'missing').length;
    let sitOutStreak = 0;
    for (let i = timeline.length - 1; i >= 0; i--) {
      const c = timeline[i].classification;
      if (c === 'sit-out' || c === 'missing') sitOutStreak++;
      else break;
    }
    stats[lens] = { timeline, appearances, sitOutStreak };
  }
  return { stats, reviewCount: reviews.length };
}

function collectLensFileStats() {
  if (!fs.existsSync(lensesFile)) {
    return { totalLines: 0, sectionLines: Object.fromEntries(ANCHOR_LENSES.map((l) => [l, 0])) };
  }
  const content = fs.readFileSync(lensesFile, 'utf-8');
  const totalLines = content.split('\n').length;
  const sectionLines = {};
  for (const lens of ANCHOR_LENSES) {
    const section = sectionBody(content, lens, [3, 4]);
    sectionLines[lens] = section ? section.lineCount : 0;
  }
  return { totalLines, sectionLines };
}

function evaluateLens(lens, lensStats, fileStats) {
  const signals = [];
  if (lensStats.appearances >= TRACK_RECORD_THRESHOLD) {
    signals.push(`Track record depth: ${lensStats.appearances} passes (>=${TRACK_RECORD_THRESHOLD})`);
  }
  if (lensStats.sitOutStreak >= SIT_OUT_STREAK_THRESHOLD) {
    signals.push(`Sit-out streak: ${lensStats.sitOutStreak} consecutive passes (>=${SIT_OUT_STREAK_THRESHOLD})`);
  }
  if (fileStats.sectionLines[lens] > SECTION_LINE_THRESHOLD) {
    signals.push(`Section weight: ${fileStats.sectionLines[lens]} lines in review-lenses.md (>${SECTION_LINE_THRESHOLD})`);
  }
  return signals;
}

function main() {
  const { stats, reviewCount } = collectLensTimelines();
  const fileStats = collectLensFileStats();

  console.log('Lens -> Skill promotion check');
  console.log('=============================');
  console.log(`Reviews scanned: ${reviewCount}`);
  console.log(`review-lenses.md: ${fileStats.totalLines} lines${fileStats.totalLines > FILE_LINE_THRESHOLD ? ` (>${FILE_LINE_THRESHOLD}: system-level signal toward splitting)` : ''}`);
  console.log();

  let anyPromote = false;
  let anyWatch = false;
  for (const lens of ANCHOR_LENSES) {
    const lensStats = stats[lens];
    const signals = evaluateLens(lens, lensStats, fileStats);
    const status = signals.length >= 2 ? 'PROMOTE' : signals.length === 1 ? 'watch' : 'ok';
    console.log(`${lens}: ${status}`);
    console.log(`  appearances ${lensStats.appearances}/${reviewCount}  sit-out-streak ${lensStats.sitOutStreak}  section ${fileStats.sectionLines[lens]}L`);
    for (const s of signals) console.log(`  - ${s}`);
    if (status === 'PROMOTE') anyPromote = true;
    if (status === 'watch') anyWatch = true;
    console.log();
  }

  console.log('Judgement signals (not auto-detected — you decide):');
  console.log('  - Prototype-specific posture: lens holds a different stance on Channels vs Invite');
  console.log('  - Versioned drift: lens has been explicitly re-versioned (Frank-v2 etc.)');
  console.log();

  if (anyPromote) {
    console.log('Action: one or more lenses crossed the threshold. See "Promoting a lens to a skill" in context/review-lenses.md.');
  } else if (anyWatch) {
    console.log('No promotions yet. One or more lenses are within one signal of the threshold — keep an eye on them.');
  } else {
    console.log('No promotions yet. The lens system is still earning its keep as a single document.');
  }
}

main();
