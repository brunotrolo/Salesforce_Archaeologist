// O agente declarado como auditor não tem ferramenta de escrita.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export default function ({ repo, args }) {
  const t = /^tools:\s*(.*)$/m.exec(readFileSync(join(repo, args.agente), 'utf8'))?.[1] ?? ''; const tem = (args.proibidas ?? ['Write', 'Edit', 'NotebookEdit']).filter((x) => new RegExp(`\\b${x}\\b`).test(t));
  return tem.length ? { ok: false, motivo: `${args.agente} tem ferramenta de escrita: ${tem.join(', ')}` } : { ok: true };
}
