// O .claude/settings.json da skill nega (permissions.deny) as ações perigosas listadas.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export default function ({ repo, args }) {
  const p = join(repo, '.claude/settings.json'); if (!existsSync(p)) return { ok: false, motivo: 'sem .claude/settings.json' };
  const deny = (JSON.parse(readFileSync(p, 'utf8')).permissions?.deny ?? []).map(String);
  const falta = args.nega.filter((x) => !deny.some((d) => d === x || d.startsWith(x.replace(/ \*\)$/, '')))); return falta.length ? { ok: false, motivo: `não nega: ${falta.join(', ')}` } : { ok: true };
}
