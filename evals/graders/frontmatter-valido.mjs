// Todo SKILL.md das raízes começa com frontmatter com name e description.
import { relative } from 'node:path';
import { ler, textos } from './lib-arquivos.mjs';
export default function ({ repo, args }) {
  const achados = textos(repo, args.raizes, /SKILL\.md$/); if (!achados.length) return { ok: false, motivo: 'nenhum SKILL.md encontrado' };
  for (const f of achados) { const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(ler(f)); if (!m || !/^name:\s*\S/m.test(m[1]) || !/^description:\s*\S/m.test(m[1])) return { ok: false, motivo: `${relative(repo, f)} sem frontmatter com name e description` }; }
  return { ok: true };
}
