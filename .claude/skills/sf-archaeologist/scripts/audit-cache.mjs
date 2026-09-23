#!/usr/bin/env node
// Cache incremental por hash de conteúdo para o Audit Loop (Fase 3).
// Sem dependências externas. Não conta nada sozinho — só diz QUAIS
// arquivos mudaram desde a última iteração, para o @sf-auditor escopar
// rg/find só ao delta em vez de reprocessar force-app/ inteiro a cada
// uma das até-5 iterações.
//
// Uso:
//   node audit-cache.mjs diff   <scopeDir> <cacheFile>   # não muda o cache
//   node audit-cache.mjs commit <scopeDir> <cacheFile>   # snapshot pós-iteração
//
// "diff" imprime JSON { added, changed, removed, unchanged } (paths
// relativos a scopeDir). Fail-closed: scopeDir inexistente é erro (exit 1),
// nunca "tudo unchanged" por omissão.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Mesmas extensões que auditor.md já varre via rg/find (Seções 1-9).
const TRACKED_EXT = [
  '.cls',
  '.trigger',
  '.js',
  '.flow-meta.xml',
  '.md-meta.xml',
  '.validationRule-meta.xml',
  '.namedCredential-meta.xml',
  '.externalCredential-meta.xml',
];

function isTracked(name) {
  return TRACKED_EXT.some((ext) => name.endsWith(ext));
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (isTracked(entry)) out.push(full);
  }
  return out;
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function currentManifest(scopeDir) {
  const manifest = {};
  for (const f of walk(scopeDir)) {
    manifest[relative(scopeDir, f)] = hashFile(f);
  }
  return manifest;
}

function loadCache(cacheFile) {
  if (!existsSync(cacheFile)) return {};
  return JSON.parse(readFileSync(cacheFile, 'utf8'));
}

function diffManifests(previous, current) {
  const added = [];
  const changed = [];
  const unchanged = [];
  for (const [path, hash] of Object.entries(current)) {
    if (!(path in previous)) added.push(path);
    else if (previous[path] !== hash) changed.push(path);
    else unchanged.push(path);
  }
  const removed = Object.keys(previous).filter((path) => !(path in current));
  return {
    added: added.sort(),
    changed: changed.sort(),
    removed: removed.sort(),
    unchanged: unchanged.sort(),
  };
}

function main() {
  const [, , cmd, scopeDir, cacheFile] = process.argv;
  if (!cmd || !scopeDir || !cacheFile || !['diff', 'commit'].includes(cmd)) {
    console.error('Uso: node audit-cache.mjs <diff|commit> <scopeDir> <cacheFile>');
    process.exit(1);
  }
  if (!existsSync(scopeDir)) {
    console.error(`Erro: scopeDir não existe: ${scopeDir}`);
    process.exit(1);
  }

  const current = currentManifest(scopeDir);

  if (cmd === 'diff') {
    const previous = loadCache(cacheFile);
    const result = diffManifests(previous, current);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // commit: snapshot do estado atual — chamar só depois que o @sf-auditor
  // já incorporou added+changed nas contagens desta iteração.
  writeFileSync(cacheFile, JSON.stringify(current, null, 2));
  console.log(`OK: cache atualizado (${Object.keys(current).length} arquivos) em ${cacheFile}`);
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { walk, hashFile, currentManifest, diffManifests, TRACKED_EXT };
