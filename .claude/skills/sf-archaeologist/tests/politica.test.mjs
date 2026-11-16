import { test } from 'node:test';
import assert from 'node:assert/strict';
import politica from '../scripts/politicas/sf-archaeologist.mjs';

const sh = (command, tool_name = 'Bash') => politica({ tool_name, tool_input: { command } });
test('política do Odin: qualquer escrita na org é negada (Bash e PowerShell)', () => {
  for (const c of ['sf data create record -s Account -v "Name=x" -o dev', 'sf data update record -s Account -i 001 -o dev', 'sf data delete record -s Account -i 001', 'sf data import tree -p plan.json', 'sf project deploy start --metadata ApexClass:Foo', 'sf apex run -f x.apex -o dev', 'sf org delete scratch -o x', 'sf project delete source', 'sf package install -p 04t'])
    assert.equal(sh(c)?.decisao, 'negar', c);
  assert.equal(sh('sf data create record -s Account -o dev', 'PowerShell')?.decisao, 'negar');
});
test('política do Odin: leitura da org passa (query, describe, retrieve, logs, git)', () => {
  for (const c of ['sf data query -q "SELECT Id FROM Account LIMIT 1" -o dev', 'sf sobject describe -s Case -o dev', 'sf project retrieve start --metadata ApexClass', 'sf apex log get --number 1', 'sf apex run test --class-names Foo', 'sf org display -o dev', 'git status'])
    assert.equal(sh(c), null, c);
});
test('política do Odin: outras ferramentas e entrada vazia passam', () => {
  assert.equal(politica({ tool_name: 'Read', tool_input: { file_path: 'a.md' } }), null); assert.equal(politica(undefined), null);
});
