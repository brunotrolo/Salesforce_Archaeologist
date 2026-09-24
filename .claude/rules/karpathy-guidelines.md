# Karpathy Guidelines (MIT)

Four principles for working with an AI coding agent, distilled from Andrej
Karpathy's public writing on the discipline of agent-assisted engineering.
These load always, for every phase of this skill.

1. **Think before coding.** A result produced without enough evidence is a
   question, not a conclusion. Jumping to an answer before the evidence
   supports it is the single most expensive mistake an agent can make,
   because a wrong conclusion downstream (a wrong root cause, a wrong count)
   compounds into every artifact built on top of it.
2. **Simplicity first.** The smallest change that the confirmed finding
   requires — never an opportunity to "improve" a method while you're in
   there, never a wider survey than what was asked "just to be safe."
3. **Surgical changes.** A change scoped exactly to what the evidence
   justifies, nothing broader, nothing "while I'm at it."
4. **Goal-oriented execution.** "The script ran without error" is not
   "the script extracted correctly." Success is measured against the actual
   goal, not against the absence of a visible failure.

## Neste projeto

1. **Pense antes de codar** — nenhuma fase deste pipeline conclui nada sem
   evidência determinística. Um `@sf-deep-diver` que documenta uma chamada de
   integração "porque parece que existe" produz exatamente o tipo de doc que
   o `@sf-auditor` existe para rejeitar — e se o auditor também relaxar o
   critério, a alucinação vira permanente.
2. **Simplicidade primeiro** — o `@sf-surveyor` lê só assinaturas/decorators
   na Fase 1 pelo mesmo motivo: qualquer "vou aproveitar e já ler o corpo do
   método" quebra o orçamento de tokens do survey raso e antecipa trabalho
   que pertence à Fase 2.
3. **Mudanças cirúrgicas** — reforçado estruturalmente: o `@sf-architect` só
   desenha o que o `@sf-auditor` já validou, nunca "adianta" um diagrama de
   uma jornada ainda não auditada, mesmo que pareça óbvio como ela termina.
4. **Execução orientada a objetivo** — "o `grep`/`find` rodou sem erro" não é
   "a contagem bate com a documentação"; é exatamente essa distinção que a
   Fase 3 (Audit Loop) formaliza: o critério de sucesso é paridade
   verificada, não ausência de exceção durante a varredura.
