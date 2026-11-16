// ADR 0017 §4: nenhum SKILL.md ou referência passa do teto de 8.000 tokens (estimativa: caracteres / 3,5).
import { relative } from 'node:path';
import { ler, textos } from './lib-arquivos.mjs';
export default function ({ repo, args }) {
  for (const f of textos(repo, args.raizes, /\.md$/)) { const tokens = Math.ceil(ler(f).length / 3.5); if (tokens > (args.maximo ?? 8000)) return { ok: false, motivo: `${relative(repo, f)} tem cerca de ${tokens} tokens (teto ${args.maximo ?? 8000})` }; }
  return { ok: true };
}
