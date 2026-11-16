// Roda o hook (guard) real da skill com uma entrada de ferramenta e confere a decisão: allow | deny | ask.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
export default function ({ repo, args }) {
  const entrada = { tool_name: args.ferramenta ?? 'Bash', tool_input: args.entrada, cwd: repo, hook_event_name: 'PreToolUse' };
  const r = spawnSync('node', [join(repo, args.script)], { input: JSON.stringify(entrada), cwd: repo, encoding: 'utf8', timeout: 30_000, env: { ...process.env, CLAUDE_PROJECT_DIR: repo } });
  if (r.error) return { ok: false, motivo: `o guard não rodou: ${r.error.message}` };
  let decisao = 'allow';
  if (r.stdout.trim()) { try { decisao = JSON.parse(r.stdout).hookSpecificOutput?.permissionDecision ?? 'allow'; } catch { return { ok: false, motivo: 'saída do guard ilegível' }; } }
  return decisao === args.esperado ? { ok: true } : { ok: false, motivo: `o guard decidiu "${decisao}"; o esperado era "${args.esperado}"` };
}
