# AGENTS.md — Salesforce Archaeologist

Instructions for any coding agent working **in this repository**. Vendor-neutral
by design (Claude Code, Cursor, Codex and similar). `CLAUDE.md` points here so
there is a single source of truth.

## What this repository is

This repository **is a Claude Code Skill**, not a Salesforce project. What
ships is the content of `.claude/` — the `sf-archaeologist` orchestrator
skill, 4 real subagents, 10 analysis playbooks, one rules file — installed
inside someone else's Salesforce SFDX-source project (`force-app/main/default`).

The skill does automated reverse engineering of a Salesforce org in 4
sequential phases, each gated by the previous one's output:

1. **Survey** (`@sf-surveyor`) — shallow, token-efficient AST outlining of
   100% of the metadata tree.
2. **Deep Dive** (`@sf-deep-diver`) — SBAR-style graph tracing of one journey
   or technical target, in 5 mandatory levels, with Source Linkage
   (`file:line`) on every entry.
3. **Audit Loop** (`@sf-auditor`) — deterministic, zero-tolerance
   reconciliation between the generated documentation and the real
   code/metadata (via `rg`/`find`/`sf data query` counts), plus
   Well-Architected scoring. Never writes documentation, only rejects or
   approves.
4. **Model** (`@sf-architect`) — C4/Arcfile diagram synthesis, gated on the
   Fase 3 output carrying a `VERIFIED_100_PERCENT` seal.

## Architecture — read before touching structure

```
.claude/
├── skills/sf-archaeologist/SKILL.md   # orchestrator: 4-phase protocol, dispatch envelope
├── agents/                            # the 4 real subagents (Task-invokable)
│   ├── sf-surveyor.md
│   ├── sf-deep-diver.md
│   ├── sf-auditor.md
│   └── sf-architect.md
├── skills/analysis-playbooks/         # 10 domain playbooks the subagents read by path
├── commands/                          # /archaeologist survey|dig|model
└── rules/
    ├── salesforce-standards.md        # single source of truth: taxonomy, limits, security
    └── karpathy-guidelines.md         # behavioral discipline (MIT) — loads always
```

**The subagents are real Claude Code subagents, not prose files read by the
skill.** Each `.claude/agents/*.md` file has valid `name`+`description`
frontmatter and is invoked via the Task tool by the orchestrator. Do not move
them back into `.claude/skills/sf-archaeologist/` as unstructured prose —
that was a real bug this repo previously shipped with (files with zero
frontmatter, referenced with `@`-mention syntax that only real subagents
support), and it made the "4 subagentes" claim in the README false: those
files were inert.

## Non-negotiable rules

### 1. A Skill's frontmatter is `name` + `description`, nothing else
The official field for pre-approving specific tool calls inside a Skill is
`allowed-tools` (hyphenated) — never `tools:` as a bare list, which is the
**subagent** frontmatter field and does nothing inside a `SKILL.md`. All 11
`SKILL.md` files in this repo shipped with this exact bug before this
revision (a `tools:` list in `SKILL.md` frontmatter, silently ignored by the
Skill loader). Before adding any new playbook, check its frontmatter has
only `name` + `description` (add `allowed-tools` only if you have a concrete,
narrow reason to pre-approve specific commands).

### 2. Zero-hallucination reconciliation is the whole point
`@sf-auditor`'s job is to make paridade 100% mandatory, not aspirational. It
never generates documentation, never approves on "close enough", and never
accepts a rejection being overridden by schedule pressure — that failure mode
is explicitly covered in `evaluations/evals.json` (eval 4). If you change the
auditor's rules, re-run that eval scenario mentally (or for real) before
shipping.

### 3. `@sf-architect` never draws without the precondition
No diagram generation without a `VERIFIED_100_PERCENT` seal from `@sf-auditor`
on the exact target being modeled. A partial/best-effort diagram from an
unvalidated document is worse than no diagram — it looks authoritative.

### 4. Source Linkage on every documented finding
```
Source: <path/file.ext>:<start_line>-<end_line>
Context: <class.method> | <flow.node> | <object.validationRule> | <customMetadata.developerName>
Evidence: "<literal excerpt, up to 200 chars>"
```
This is what makes the audit loop's counters checkable instead of trusted.

### 5. Nothing real ships here
No real endpoint, credential, org name, employer name, or class/component
name pulled from an actual analyzed org. This repository is the *template*
that gets pointed at someone else's real org — it must stay a template.
Examples use generic names (`AccountService`, `IntegrationConfig__mdt`,
`api.partner.example.com`).

### 6. This repo's own attribution must stay honest
`.claude/skills/analysis-playbooks/` are original playbooks written for this
project — they are **not** a redistribution of Salesforce's or anyone else's
official skills. Never reintroduce "Salesforce Official Skill" language in a
playbook's heading, frontmatter, or README table — that framing was a real,
previously-shipped attribution error, corrected once already. Say "Playbook
de Análise" / "analysis playbook" instead.

### 7. Language
Agent, rule and skill files are written in English. `README.md` is in PT-BR
(this project's primary audience). Talk to the user in PT-BR.

## Repository map

```
.claude/
├── commands/                              # 3 slash commands
├── rules/
│   ├── salesforce-standards.md            # 18 sections: taxonomy, limits, fflib, security, anti-patterns…
│   └── karpathy-guidelines.md             # behavioral discipline, MIT
├── agents/                                # 4 real subagents
└── skills/
    ├── sf-archaeologist/
    │   ├── SKILL.md                       # orchestrator
    │   ├── scripts/audit-cache.mjs        # incremental hash cache for the Fase 3 loop
    │   ├── selftest/                      # fail-closed test for audit-cache.mjs
    │   └── evaluations/evals.json         # 4 behavioral regression scenarios
    └── analysis-playbooks/                # 10 domain playbooks (apex, flow, lwc, C4, etc.)
        └── lwc-extractor/
            ├── scripts/lwc-apex-callgraph.mjs   # deterministic LWC→Apex call graph
            └── selftest/                        # fail-closed test against a known fixture
assets/banner.svg
CLAUDE.md
AGENTS.md
README.md
LICENSE
test-skill.sh                              # structural + selftest validation, run before every push
```

## Definition of done

- [ ] `bash test-skill.sh` passes end-to-end (structure, frontmatter, both
      selftests, evaluations JSON validity)
- [ ] No `SKILL.md` frontmatter has a bare `tools:` field
- [ ] Every subagent file in `.claude/agents/` has `name` + `description`
      frontmatter and is referenced only via Task, never read as static text
- [ ] No real org name, endpoint, credential, or component name anywhere
- [ ] No "Salesforce Official Skill" / "skill oficial" framing anywhere
- [ ] `README.md` reflects any structural change (paths, subagent count, phases)
- [ ] `evaluations/evals.json` stays valid JSON and covers the 4 phases'
      hardest failure modes (skip a phase, override a rejection, draw without
      the precondition, treat shallow survey as if it read method bodies)
