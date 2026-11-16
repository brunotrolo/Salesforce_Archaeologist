// Nenhuma credencial conhecida nos arquivos de texto da skill.
import { relative } from 'node:path';
import { ler, textos } from './lib-arquivos.mjs';
const SEGREDO = /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AIza[0-9A-Za-z_-]{35}/;
export default function ({ repo, args }) {
  for (const f of textos(repo, args.raizes)) { const m = SEGREDO.exec(ler(f)); if (m) return { ok: false, motivo: `${relative(repo, f)} parece conter uma credencial (${m[0].slice(0, 6)}…)` }; }
  return { ok: true };
}
