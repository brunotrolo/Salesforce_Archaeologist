// Os textos da skill não podem trazer instrução dirigida a agentes de fora (mesma regra da ingestão do RAG do Odin).
import { relative } from 'node:path';
import { ler, textos } from './lib-arquivos.mjs';
const INJECAO = /\b(ignore|desconsidere|esque[cç]a)\b.{0,40}\b(instru[cç][oõ]es anteriores|regras anteriores|todas as regras)\b|\bnota para (o|a) (agente|revisor|ia|assistente)\b|\bvoc[eê] agora [eé] (um|uma|o|a)\b/i;
export default function ({ repo, args }) {
  for (const f of textos(repo, args.raizes, /\.(md|txt)$/)) { const m = ler(f).split('\n').findIndex((l) => INJECAO.test(l) && !/n[aã]o|nunca|recus|injec|ataque|exemplo/i.test(l)); if (m >= 0) return { ok: false, motivo: `${relative(repo, f)}:${m + 1} parece instrução injetada` }; }
  return { ok: true };
}
