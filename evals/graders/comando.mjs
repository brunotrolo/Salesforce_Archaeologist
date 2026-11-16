// Roda um script da skill (node) e confere o código de saída (padrão 0).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
export default function ({ repo, args }) {
  const r = spawnSync('node', [args.script, ...(args.argumentos ?? [])], { cwd: join(repo, args.cwd ?? '.'), encoding: 'utf8', timeout: 120_000 });
  if (r.error) return { ok: false, motivo: `não rodou: ${r.error.message}` };
  const esperado = args.saida ?? 0;
  return r.status === esperado ? { ok: true } : { ok: false, motivo: `saiu com ${r.status} (esperado ${esperado}): ${(r.stderr || r.stdout).trim().split('\n').slice(-2).join(' | ').slice(0, 200)}` };
}
