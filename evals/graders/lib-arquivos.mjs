import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
/** Arquivos de texto das raízes (arquivo ou pasta, relativas ao repositório da skill). */
export function textos(repo, raizes, ext = /\.(md|json|ya?ml|mjs|js|txt|html)$/) {
  const saida = []; const andar = (p) => { if (!existsSync(p)) return; const s = statSync(p); if (s.isDirectory()) { for (const n of readdirSync(p)) if (n !== 'node_modules' && n !== '.git') andar(join(p, n)); } else if (ext.test(p)) saida.push(p); };
  for (const r of raizes) andar(join(repo, r)); return saida;
}
export const ler = (p) => readFileSync(p, 'utf8');
