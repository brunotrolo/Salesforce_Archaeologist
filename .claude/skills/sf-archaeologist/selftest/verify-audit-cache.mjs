#!/usr/bin/env node
// Fail-closed contra fixture de verdade conhecida (fixtures/tree).
// Roda: node selftest/verify-audit-cache.mjs
// Trabalha numa cópia temporária (os.tmpdir()) — nunca muta fixtures/tree,
// que fica intacto no git para toda nova rodada.

import { mkdtempSync, cpSync, writeFileSync, appendFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffManifests, currentManifest } from '../scripts/audit-cache.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_SRC = join(HERE, 'fixtures', 'tree');

function fail(msg) {
  console.error(`FALHA (selftest audit-cache): ${msg}`);
  process.exit(1);
}

function assertSets(label, actual, expected) {
  const a = [...actual].sort();
  const e = [...expected].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) {
    fail(`${label}: esperado ${JSON.stringify(e)}, obtido ${JSON.stringify(a)}`);
  }
}

const work = mkdtempSync(join(tmpdir(), 'sf-archaeologist-audit-cache-'));
try {
  cpSync(FIXTURE_SRC, work, { recursive: true });
  const cacheFile = join(work, '.audit-cache.json');

  // Baseline: commit "vazio" (cache não existe ainda) -> diff deve reportar
  // ServiceA e ServiceB como "added" (nunca como "unchanged" por omissão —
  // isso seria o mesmo bug-class de falso-positivo que já pegamos antes).
  const baselineDiff = diffManifests({}, currentManifest(work));
  assertSets('baseline (sem cache prévio)', baselineDiff.added, [
    'classes/ServiceA.cls',
    'classes/ServiceB.cls',
  ]);
  if (baselineDiff.unchanged.length !== 0) {
    fail(`baseline não deveria ter "unchanged", obteve ${JSON.stringify(baselineDiff.unchanged)}`);
  }

  // Commit real via CLI (mesmo binário que o @sf-auditor chama).
  const { execFileSync } = await import('node:child_process');
  const scriptPath = join(HERE, '..', 'scripts', 'audit-cache.mjs');
  execFileSync('node', [scriptPath, 'commit', work, cacheFile], { stdio: 'pipe' });

  // Muta ServiceA (changed), adiciona ServiceC (added), remove ServiceB (removed).
  appendFileSync(join(work, 'classes', 'ServiceA.cls'), '// alterado\n');
  writeFileSync(join(work, 'classes', 'ServiceC.cls'), 'public class ServiceC {}\n');
  unlinkSync(join(work, 'classes', 'ServiceB.cls'));

  const out = execFileSync('node', [scriptPath, 'diff', work, cacheFile], { stdio: 'pipe' });
  const diff = JSON.parse(out.toString());

  assertSets('changed', diff.changed, ['classes/ServiceA.cls']);
  assertSets('added', diff.added, ['classes/ServiceC.cls']);
  assertSets('removed', diff.removed, ['classes/ServiceB.cls']);
  assertSets('unchanged', diff.unchanged, []);

  console.log('OK selftest audit-cache: added/changed/removed/unchanged batem 100% com a fixture');
  process.exit(0);
} finally {
  rmSync(work, { recursive: true, force: true });
}
