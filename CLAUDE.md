# CLAUDE.md

Este repositório segue a convenção `AGENTS.md` como fonte única de verdade para
regras de agente, vendor-neutra (Claude Code, Cursor, Codex e afins). Leia
[`AGENTS.md`](./AGENTS.md) antes de propor qualquer mudança estrutural.

Pontos específicos do Claude Code:

- Os 4 subagentes do pipeline (`sf-surveyor`, `sf-deep-diver`, `sf-auditor`,
  `sf-architect`) vivem em `.claude/agents/` e são invocados via Task pelo
  orquestrador (`.claude/skills/sf-archaeologist/SKILL.md`) — nunca lidos como
  texto estático para "simular" uma fase.
- Os 3 comandos slash (`/archaeologist survey|dig|model`) estão em
  `.claude/commands/`.
- `.claude/rules/salesforce-standards.md` e `.claude/rules/karpathy-guidelines.md`
  carregam sempre, no início da sessão.
