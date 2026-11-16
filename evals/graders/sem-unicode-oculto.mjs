// ADR 0017 §2: nenhum caractere Unicode invisível nos textos que chegam ao modelo.
import { relative } from 'node:path';
import { ler, textos } from './lib-arquivos.mjs';
const PROIBIDO = /[​-‏‪-‮⁠-⁤⁦-⁩­᠎]|[\u{E0000}-\u{E007F}]|[\u{E0100}-\u{E01EF}]/u;
export default function ({ repo, args }) {
  for (const f of textos(repo, args.raizes, /\.(md|ya?ml|txt)$/)) { const t = ler(f); const i = t.search(PROIBIDO); const bom = t.indexOf('﻿', 1); if (i >= 0 || bom > 0) return { ok: false, motivo: `${relative(repo, f)}: caractere invisível U+${(t.codePointAt(i >= 0 ? i : bom)).toString(16).toUpperCase()}` }; }
  return { ok: true };
}
