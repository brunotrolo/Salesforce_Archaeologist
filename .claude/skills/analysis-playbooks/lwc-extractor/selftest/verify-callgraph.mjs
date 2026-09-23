#!/usr/bin/env node
// Fail-closed contra fixture de verdade conhecida (fixtures/testWizard).
// Roda: node selftest/verify-callgraph.mjs
// Sucesso silencioso NUNCA é aceitável aqui — qualquer divergência,
// incluindo contadores zero, é exit 1.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk, analyzeFile } from '../scripts/lwc-apex-callgraph.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');

const expected = JSON.parse(readFileSync(join(FIXTURES, 'expected.json'), 'utf8'));

const files = walk(FIXTURES).filter((f) => !f.endsWith('expected.json'));
const actual = {
  components: files
    .map((f) => analyzeFile(f, FIXTURES))
    .filter((c) => c.apex_calls.length > 0),
};

function fail(msg) {
  console.error(`FALHA (selftest lwc-apex-callgraph): ${msg}`);
  process.exit(1);
}

if (actual.components.length !== expected.components.length) {
  fail(
    `esperado ${expected.components.length} componente(s) com apex_calls, obtido ${actual.components.length}`
  );
}

for (const expComp of expected.components) {
  const actComp = actual.components.find((c) => c.component === expComp.component);
  if (!actComp) fail(`componente esperado ausente: ${expComp.component}`);

  if (actComp.apex_calls.length !== expComp.apex_calls.length) {
    fail(
      `${expComp.component}: esperado ${expComp.apex_calls.length} apex_calls, obtido ${actComp.apex_calls.length}`
    );
  }

  for (const expCall of expComp.apex_calls) {
    const actCall = actComp.apex_calls.find((c) => c.method === expCall.method);
    if (!actCall) fail(`${expComp.component}: chamada esperada ausente: ${expCall.method}`);
    if (actCall.type !== expCall.type) {
      fail(
        `${expComp.component}.${expCall.method}: type esperado "${expCall.type}", obtido "${actCall.type}"`
      );
    }
    if (actCall.line !== expCall.line) {
      fail(
        `${expComp.component}.${expCall.method}: line esperada ${expCall.line}, obtida ${actCall.line}`
      );
    }
  }
}

// Negativo explícito: getRecord (lightning/uiRecordApi) NUNCA pode aparecer
// como apex_call — se aparecer, o regex de import está pegando imports que
// não são @salesforce/apex, o que é o oposto do que a skill promete.
const leaked = actual.components.some((c) =>
  c.apex_calls.some((call) => call.method.includes('uiRecordApi') || call.method === 'getRecord')
);
if (leaked) fail('import não-Apex (lightning/uiRecordApi) vazou como apex_call — falso positivo');

console.log('OK selftest lwc-apex-callgraph: fixture de verdade conhecida bate 100%');
process.exit(0);
