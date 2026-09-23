#!/usr/bin/env node
// Extração determinística do grafo LWC -> Apex (imports @salesforce/apex).
// Sem dependências externas, sem LLM: regex sobre sintaxe fixa do LWC.
//
// Uso:
//   node lwc-apex-callgraph.mjs <diretorio-lwc>
// Saída (stdout): JSON { components: [ { component, file, apex_calls: [...] } ] }
//
// Escopo deliberado: só o que é determinável por sintaxe (método Apex
// importado, se o import é usado dentro de @wire(...) ou chamado como
// função, linha do import e linha do primeiro uso). Semântica de negócio
// (params, error_handling, "called_from") continua exigindo leitura humana/LLM
// e não é inferida aqui — ver lwc-extractor/SKILL.md.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const IMPORT_RE = /import\s+(\w+)\s+from\s+['"]@salesforce\/apex\/([\w.]+)['"]/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function analyzeFile(filePath, scopeDir) {
  const text = readFileSync(filePath, 'utf8');
  const component = basename(filePath, '.js');
  const apexImports = [];
  for (const m of text.matchAll(IMPORT_RE)) {
    apexImports.push({
      localName: m[1],
      method: m[2],
      importLine: lineOf(text, m.index),
    });
  }

  const apex_calls = apexImports.map(({ localName, method, importLine }) => {
    // @wire(localName, {...}) => wire adapter reativo a Apex
    const wireRe = new RegExp(`@wire\\(\\s*${localName}\\b`);
    const wireMatch = wireRe.exec(text);
    if (wireMatch) {
      return {
        method,
        type: 'wire',
        line: lineOf(text, wireMatch.index),
        source: `${relative(scopeDir, filePath)}:${lineOf(text, wireMatch.index)}`,
      };
    }
    // localName(...) chamado como função fora do import => imperativo
    const callRe = new RegExp(`\\b${localName}\\s*\\(`, 'g');
    let firstCall = null;
    for (const c of text.matchAll(callRe)) {
      if (c.index === undefined) continue;
      // ignora o próprio import (não tem "(" logo após na mesma forma) — o
      // import não bate com este regex por não ter parênteses, então
      // qualquer match aqui já é uso real.
      firstCall = c;
      break;
    }
    if (firstCall) {
      return {
        method,
        type: 'imperative',
        line: lineOf(text, firstCall.index),
        source: `${relative(scopeDir, filePath)}:${lineOf(text, firstCall.index)}`,
      };
    }
    // Importado mas nunca usado no arquivo — reporta como facto, não esconde.
    return {
      method,
      type: 'imported_unused',
      line: importLine,
      source: `${relative(scopeDir, filePath)}:${importLine}`,
    };
  });

  return { component, file: relative(scopeDir, filePath), apex_calls };
}

function main() {
  const scopeDir = process.argv[2];
  if (!scopeDir) {
    console.error('Uso: node lwc-apex-callgraph.mjs <diretorio-lwc>');
    process.exit(1);
  }
  let files;
  try {
    files = walk(scopeDir);
  } catch (e) {
    console.error(`Erro ao ler ${scopeDir}: ${e.message}`);
    process.exit(1);
  }
  const components = files
    .map((f) => analyzeFile(f, scopeDir))
    .filter((c) => c.apex_calls.length > 0);

  console.log(JSON.stringify({ components }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeFile, walk };
