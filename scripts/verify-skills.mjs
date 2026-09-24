#!/usr/bin/env node
// verify-skills.mjs — valida frontmatter de SKILL.md sem dependências externas
// Uso: node scripts/verify-skills.mjs
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const roots = ['.', '.claude/skills', 'skills', '.claude/skills/analysis-playbooks'];
const fails = [];
let checked = 0;

function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return { error: 'missing frontmatter ---' };
  const body = m[1];
  const lines = body.split('\n');
  const fm = {};
  let i = 0;
  let lastKey = null;
  for (const line of lines) {
    i++;
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) {
      // continuação de valor multilinha (ex: description quebrada) — anexa ao último campo
      if (lastKey && fm[lastKey] !== undefined) {
        fm[lastKey] += ' ' + line.trim();
      }
      continue;
    }
    const key = line.slice(0, colon).trim();
    lastKey = key;
    let val = line.slice(colon + 1).trim();
    // detect nested mapping without quotes: "name: foo: bar"
    if (val.includes(':') && !(val.startsWith('"') && val.endsWith('"')) && !(val.startsWith("'") && val.endsWith("'"))) {
      // allow URLs with :// but not " : "
      const afterFirst = val.slice(val.indexOf(':') + 1);
      if (afterFirst.trim() && !val.includes('://')) {
        fails.push(`${file}:${i} — valor com ':' não-quotado → "${line}"  → use aspas: "${val}"`);
      }
    }
    // strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function walk(dir) {
  let ents;
  try { ents = readdirSync(dir); } catch { return; }
  for (const e of ents) {
    const p = join(dir, e);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      if (e === 'node_modules' || e === '.git') continue;
      walk(p);
    } else if (e === 'SKILL.md') {
      checked++;
      const raw = readFileSync(p, 'utf8');
      const fm = parseFrontmatter(raw, p);
      if (fm.error) { fails.push(`${p}: ${fm.error}`); continue; }
      if (!fm.name) fails.push(`${p}: missing 'name'`);
      if (!fm.description) fails.push(`${p}: missing 'description'`);
      else if (fm.description.length > 1024) fails.push(`${p}: description >1024 chars (${fm.description.length})`);
      if (fm.name && String(fm.name).includes(':')) fails.push(`${p}: name contém ':' — use aspas`);
      // check allowed-tools vs tools
      if (raw.includes('\ntools:')) fails.push(`${p}: campo 'tools:' inválido — use 'allowed-tools:'`);
    }
  }
}

roots.forEach(walk);

// also walk recursively from root for any SKILL.md not in roots (full-depth)
function walkAll(dir, depth = 0) {
  if (depth > 6) return;
  let ents;
  try { ents = readdirSync(dir); } catch { return; }
  for (const e of ents) {
    const p = join(dir, e);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      if (['node_modules', '.git', '.tmp', 'dist'].includes(e)) continue;
      walkAll(p, depth + 1);
    }
  }
}
// dedup: already checked many, but ensure coverage
walkAll('.');

if (fails.length) {
  console.error(`✗ ${fails.length} erro(s) em ${checked} SKILL.md(s):\n` + fails.map(f => '  - ' + f).join('\n'));
  console.error('\nDica: valores com ":" precisam de aspas. Ex: description: "foo: bar"');
  process.exit(1);
}
console.log(`✓ ${checked} SKILL.md(s) — frontmatter OK`);
