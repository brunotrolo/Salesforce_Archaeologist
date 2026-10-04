# LESSONS.md — self-improvement log

Append-only. Each entry: date, what happened, the rule that resulted. Never
edit or delete a past entry — if a lesson turns out wrong, add a new entry
that supersedes it.

Language note: this file follows `AGENTS.md`'s own rule #7 (agent/rule/skill
files are written in English; only `README.md` is PT-BR), so entries below
are in English even though the task that first requested this file assumed
Portuguese — checked against `AGENTS.md` before writing, as instructed.

---

## 2026-W39 revision session

**2026-09-24 — Invalid `tools:` field in every `SKILL.md` frontmatter.**
What happened: all 11 `SKILL.md` files in this repo (the orchestrator plus
the 10 analysis playbooks) shipped with a `tools:` list in their YAML
frontmatter. Claude Code Skills only support `name`, `description` and
optionally `allowed-tools` (hyphenated) in frontmatter — `tools:` is the
**subagent** frontmatter field, not a Skill field, and the Skill loader
silently ignores it. The intended tool restriction was never enforced; it
just looked like it was.
Rule: never put a bare `tools:` list in a `SKILL.md` frontmatter. If a
Skill needs to pre-approve specific tool calls, use `allowed-tools` and only
when there is a concrete, narrow reason to. `test-skill.sh` now fails the
build if any `SKILL.md` under `.claude/skills` contains `^tools:`.

**2026-09-24 — False "Salesforce Official Skill" / forcedotcom attribution.**
What happened: the README and some playbook headings claimed an affiliation
with Salesforce's official skills / forcedotcom, which was not accurate —
the 10 analysis playbooks are original work written for this project, not a
redistribution of anyone else's official content.
Rule: verify attribution claims before publishing anything that names a
vendor, and correct a false claim immediately when found rather than
leaving it "mostly right." Never reintroduce "Salesforce Official Skill" /
"skill oficial" framing in a playbook's heading, frontmatter, or README
table — say "Playbook de Análise" / "analysis playbook" instead.

**2026-09-24 — 4 subagent files with zero YAML frontmatter were completely inert.**
What happened: the 4 subagents (`sf-surveyor`, `sf-deep-diver`, `sf-auditor`,
`sf-architect`) lived under `.claude/skills/sf-archaeologist/` as plain
prose files with no frontmatter at all, referenced from the orchestrator via
`@`-mention syntax. `@`-mention dispatch only works for real subagents
(files under `.claude/agents/` with valid `name`+`description` frontmatter,
invoked through the Task tool) — these files had neither the right location
nor the frontmatter, so every "4 subagentes" claim in the README was false:
the phases that supposedly ran them were actually just reading prose inline.
Rule: every file meant to be a subagent must live in `.claude/agents/` and
carry valid `name`+`description` frontmatter, or Claude Code silently never
dispatches it — it is read as static text instead of invoked. After writing
or moving a subagent file, always verify it is actually invokable (frontmatter
present, referenced via Task/`@`-mention from the orchestrator, exercised by
at least one `evaluations/evals.json` scenario) — don't just write the file
and assume dispatch works.
