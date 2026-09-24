# Salesforce Archaeologist

<p align="center">

  <img src="assets/banner.svg" width="960" alt="Salesforce Archaeologist">
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/brunotrolo/Salesforce_Archaeologist?style=flat-square&color=00A1E0&label=stars" alt="Stars">
  <img src="https://img.shields.io/badge/subagentes-4-04E1C2?style=flat-square" alt="4 subagentes">
  <img src="https://img.shields.io/badge/playbooks%20de%20an%C3%A1lise-10-032D60?style=flat-square" alt="10 playbooks de análise">
  <img src="https://img.shields.io/badge/license-MIT-032D60?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/works%20with-Claude%20Code-032D60?style=flat-square" alt="Works with Claude Code">
</p>

<p align="center">
  [![skills.sh](https://skills.sh/b/brunotrolo/Salesforce_Archaeologist)](https://skills.sh/brunotrolo/Salesforce_Archaeologist) [![CI](https://github.com/brunotrolo/Salesforce_Archaeologist/actions/workflows/ci.yml/badge.svg)](https://github.com/brunotrolo/Salesforce_Archaeologist/actions)
</p>

Framework agnóstico de **engenharia reversa**, **assessment arquitetural** e **extração de regras de negócio** em Salesforce para subsidiar migrações e refatorações seguras.

O **Salesforce Archaeologist** opera como um sistema multiagente autônomo e iterativo, orquestrado por eventos e loops fechados de validação determinística. Ele substitui semanas de auditoria manual por um pipeline contínuo que traduz metadados e código bruto em engenharia de software e visão de produto.

---

## Arquitetura de Subagentes

Os 4 subagentes abaixo são subagentes reais do Claude Code (`.claude/agents/sf-{surveyor,deep-diver,auditor,architect}.md`, invocados via Task) — não texto estático lido pelo orquestrador.

```
┌─────────────────────────────────────────────────────────────────┐
│                    @sf-archaeologist (Orquestrador)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ @sf-surveyor  │    │ @sf-deep-diver│    │ @sf-architect │
│ (Fase 1)      │    │ (Fase 2)      │    │ (Fase 4)      │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  @sf-auditor    │
                    │  (Fase 3 - Loop)│
                    └─────────────────┘
```

| Subagente | Responsabilidade | Playbooks Acionadas |
|-----------|------------------|---------------------------|
| `@sf-surveyor` | **Reconhecimento KDM & AST Outlining** — Varredura rasa de 100% do `force-app/main/default`, inventário estrutural sem ler corpos de métodos | `salesforce-metadata-cataloger`, `flow-surveyor` |
| `@sf-deep-diver` | **Escavação SBAR & Graph Engine** — Rastreamento em 5 níveis: Triggering Context → Validation Gateways → State Mutation → Outbound Integrations → Post-Processing | `apex-analyzer`, `lwc-extractor`, `integration-contract-builder` |
| `@sf-auditor` | **Loop de Reconciliação Determinística** — Contagem exata via `rg`/`find`: callouts, VRs, DML, SOQL, triggers, flows, LWC→Apex. Well-Architected scoring (Trusted/Easy/Adaptable). Loop até `VERIFIED_100_PERCENT` (máx 5 iterações) | `well-architected-checker`, `apex-governor-limits-validator` |
| `@sf-architect` | **Síntese C4 & Arcfile** — Diagramas de Sequência, ERD, Target Architecture (fflib, Event-Driven, API-Led). Exporta SVG/HTML/WebM via `arcfile-generator` | `arcfile-generator`, `c4-modeler` |

---

## Playbooks de Análise Integrados

O framework consome **10 playbooks de análise** originais, escritas para este projeto:

| Skill | Propósito no Pipeline |
|-------|----------------------|
| `apex-analyzer` | Análise estática Apex (PMD + Graph Engine): antipatterns, governor limits, fflib compliance |
| `flow-inspector` | Parsing profundo de Flow XML: decisions, loops, subflows, @InvocableMethod |
| `lwc-extractor` | Análise LWC: @wire, @api, eventos customizados, imports Apex, lifecycle hooks |
| `integration-contract-builder` | Contratos de callout literais: Named Credentials, payloads request/response, retry, circuit breaker |
| `well-architected-checker` | Scoring Trusted/Easy/Adaptable com pesos e critérios mensuráveis |
| `apex-governor-limits-validator` | Análise quantitativa de limites: SOQL, DML, CPU, Heap por cenário (single/bulk 200/2000) |
| `salesforce-metadata-cataloger` | Taxonomia completa: classificação API version, moderno vs legado, dependências cruzadas |
| `flow-surveyor` | Survey rápido via FlowDefinitionView: contagem ativos/obsoletos, conflitos de ordem de execução |
| `arcfile-generator` | Compilação e exportação Arcfile: SVG, PNG, HTML interativo, WebM animation |
| `c4-modeler` | Validação C4 Model (Simon Brown): Context, Containers, Components, Code aplicados a Salesforce |

---

## Pré-requisitos

- Org no formato **SFDX Source** (`force-app/main/default`)
- **Salesforce CLI (`sf`)** v2+ instalado e autenticado
- **Ferramentas de linha de comando**: `rg` (ripgrep), `find`, `ast-grep` (opcional)
- **Java 11+** (para Code Analyzer / PMD)
- **Node.js ≥ 20** (para LWC Jest / ESLint skills)

---

## Como começar

### O que você precisa antes de rodar

Uma org Salesforce com metadados no formato SFDX Source (`force-app/main/default`). A skill não simula — ela lê o código e metadados reais.

### Instalação

```bash
# Clone o repositório
git clone https://github.com/brunotrolo/Salesforce_Archaeologist.git
cd Salesforce_Archaeologist
```

### Para usar em seu projeto SFDX existente:

```bash
# De dentro da pasta do seu projeto SFDX
cp -r /path/to/Salesforce_Archaeologist/.claude/skills/sf-archaeologist .claude/skills/
cp -r /path/to/Salesforce_Archaeologist/.claude/skills/analysis-playbooks .claude/skills/
cp -r /path/to/Salesforce_Archaeologist/.claude/agents/* .claude/agents/
cp /path/to/Salesforce_Archaeologist/.claude/rules/salesforce-standards.md .claude/rules/
cp /path/to/Salesforce_Archaeologist/.claude/rules/karpathy-guidelines.md .claude/rules/
cp -r /path/to/Salesforce_Archaeologist/.claude/commands/* .claude/commands/
```

Depois, abra o Claude Code na pasta do projeto — a skill principal, os 4 subagentes (Task-invokable, em `.claude/agents/`), as 10 playbooks de análise, as rules e os 3 comandos `/` carregam automaticamente.

---

## O que entra no seu `.claude/`

| Caminho | O que faz | Quando carrega |
|---|---|---|
| `skills/sf-archaeologist/` | Skill orquestradora — protocolo de 4 fases, `scripts/audit-cache.mjs`, `evaluations/evals.json` | Sob demanda via comandos `/` |
| `agents/` | Os **4 subagentes reais** (Task-invokable): `sf-surveyor`, `sf-deep-diver`, `sf-auditor`, `sf-architect` — cada um com frontmatter `name`+`description` válida | Invocados via Task pelo orquestrador |
| `skills/analysis-playbooks/` | 10 playbooks de análise Salesforce (apex-analyzer, flow-inspector, lwc-extractor, etc.) — `lwc-extractor` inclui `scripts/lwc-apex-callgraph.mjs`, extração determinística do call-graph LWC→Apex | Quando subagentes leem por caminho |
| `rules/salesforce-standards.md` | Fonte de verdade única (18 seções: taxonomia, limits, fflib, execução, LWC, Flow, security, anti-patterns, Well-Architected, metadata-driven, etc.) | Início da sessão (sempre válida) |
| `rules/karpathy-guidelines.md` | Disciplina comportamental (MIT) — pense antes de codar, simplicidade, mudanças cirúrgicas, execução orientada a objetivo | Início da sessão (sempre válida) |
| `commands/` | 3 comandos slash: `/archaeologist survey`, `/archaeologist dig <alvo>`, `/archaeologist model <jornada>` | Quando você digita |

Na raiz do repositório (não copiado para o seu projeto — são documentação de
quem desenvolve *esta* skill): `AGENTS.md` (regras vendor-neutras), `CLAUDE.md`
(ponteiro específico do Claude Code), `LICENSE` (MIT), `test-skill.sh`
(validação estrutural + selftests, rodar antes de qualquer PR).

### Comandos

| Comando | O que faz |
|---|---|
| `/archaeologist survey` | Executa Fase 1 completa — survey da org, gera `CAPABILITIES_MAP.md` |
| `/archaeologist dig <alvo>` | Executa Fases 2+3 — deep dive com loop de auditoria até `VERIFIED_100_PERCENT` |
| `/archaeologist model <jornada>` | Executa Fase 4 — diagramas Arcfile/C4 validados (requer `VERIFIED_100_PERCENT`) |

---

## Como o orquestrador funciona internamente

### Fases de execução com loops fechados

#### Fase 1: Survey — Reconhecimento KDM (`/archaeologist survey`)
Invoca `@sf-surveyor` + playbooks de análise → extração via AST Outlining → gera `docs/archaeologist/CAPABILITIES_MAP.md` com Resumo Quantitativo, Tabelas KDM, Mapa Cross-Layer, Débito Técnico Survey Level.

#### Fase 2: Deep Dive — Escavação SBAR (`/archaeologist dig <alvo>`)
Invoca `@sf-deep-diver` — rastreamento em **5 níveis obrigatórios**:
1. **Triggering Context**: Entry points (LWC, Apex @AuraEnabled, Flow Screen, Event, Scheduled)
2. **Validation Gateways**: VRs, addError, Flow Decisions, Custom Permissions, Sharing/FLS
3. **State Mutation**: DML, Database methods, UoW, Flow Data Elements, Bulkification
4. **Outbound Integrations**: Contratos literais de callout (endpoint, payload, error handling, retry)
5. **Post-Processing**: @future, Queueable, Batchable, Platform Events, Email
**Source Linkage** em 100% das entradas: `Source: arquivo:linha`

#### Fase 3: Audit Loop — Validação Determinística
Automático após Fase 2. `@sf-auditor` executa contagens exatas via `rg`/`find`:
- Callouts: `HttpRequest` instanciados vs. documentados
- Validation Rules: `.validationRule-meta.xml` vs. tabelados
- DML/SOQL: statements vs. mutações/consultas documentadas
- Triggers/Flows/LWC→Apex: 100% mapeados
- **Well-Architected Check**: Trusted/Easy/Adaptable
Se `REJECTED`: retorna `missing_artifacts` + `instructions_to_deep_diver` → reexecuta Fase 2. Loop até `VERIFIED_100_PERCENT` (máx 5 iterações).
A partir da 2ª iteração, `scripts/audit-cache.mjs` (hash sha256 por arquivo) escopa `rg`/`find`
só ao delta desde a última rodada — iterações seguintes reaproveitam os contadores já
validados em vez de reprocessar `force-app/` inteiro.

#### Fase 4: Model — Síntese C4 & Arcfile (`/archaeologist model <jornada>`)
Pré-condição: documento com `VERIFIED_100_PERCENT`. `@sf-architect` gera 3 diagramas Arcfile:
1. **Sequence Diagram (C3/C4)**: Actor → LWC → Apex Controller → Service → Domain/Selector → Integration Gateway → Named Credential → External System (Happy Path + 2+ exceções)
2. **ERD (C3/C4)**: Objetos do escopo, cardinalidades, chaves estrangeiras, campos status/auditoria
3. **Target Architecture (C1/C2)**: fflib (Selector/Domain/Service/UoW), WF/PB→Flow, Event-Driven (Platform Events/CDC), API-Led
Exporta: `.arc`, `.svg`, `.html` (interativo, dark/light, tooltips Source Linkage), `.webm` (animação).

### Dispatch envelope

Quando `@sf-archaeologist` despacha um subagente, passa envelope estruturado:
```
{
  target: "<jornada>" | "callouts" | "Account",
  capabilities_map: "docs/archaeologist/CAPABILITIES_MAP.md",
  scope_path: "force-app/main/default/...",
  phase: 1 | 2 | 3 | 4
}
```

### Report contract dos subagentes

Todo subagente devolve relatório com seções padronizadas:

```markdown
## Files Touched
- force-app/main/default/classes/SerasaIntegration.cls
- force-app/main/default/objects/Account/validationRules/Valida_CNPJ.validationRule-meta.xml
- ...

## Gaps Found
- [NEEDS CLARIFICATION] CAPABILITIES_MAP.md não lista Named Credential X
- ...

## Decisions Made
- Custom object <CustomObject__c> identificado como core entity; standard object rejeitado porque...
- ...
```

O orquestrador lê `## Gaps Found` para decidir se retorna ao usuário (gap bloqueante) ou continua.

### Pipeline status e recuperação

Após cada subagente completar, o orquestrador atualiza status:

```markdown
## Pipeline Status
- [x] surveyor: done (CAPABILITIES_MAP.md gerado)
- [x] deep-diver: done (<jornada>.md gerado)
- [x] auditor: VERIFIED_100_PERCENT (iteration 3)
- [ ] architect: pending
```

Se a sessão for interrompida, retoma de onde parou.

### Iteration cap

Se `@sf-auditor` rejeitar 5 vezes o mesmo documento, o orquestrador para e escala ao usuário com relatório de inconformidade — nunca loop infinito.

### Failure routing

Quando o auditor falha, produz relatório estruturado:
```json
{
  "phase": "3-audit",
  "failing_artifact": "<ArtifactName>.cls",
  "owning_agent": "sf-deep-diver",
  "missing_artifacts": ["<ArtifactName>.cls:<line>:callout_nao_listado"],
  "instructions": "Reabra análise do método <methodName>()..."
}
```
O orquestrador usa `owning_agent` para re-invocar o subagente correto.

---

## Ciclo por execução

```
force-app/main/default/ inteira
        ↓
@sf-archaeologist: lê 100%, valida CAPABILITIES_MAP.md, monta dispatch
        ↓
@sf-surveyor → CAPABILITIES_MAP.md
        ↓
@sf-deep-diver (5 níveis) → documentação jornada/technical/
        ↓                                              (Source Linkage 100%)
@sf-auditor: rg/find contadores + Well-Architected → VERIFIED_100_PERCENT
        ↓                                              (loop até convergir)
@sf-architect: C4 + Arcfile → diagrams/*.{arc,svg,html,webm}
        ↓
Entrega: inventário + jornadas + diagramas validados
```

Uma análise só é "concluída" quando `@sf-auditor` reporta `VERIFIED_100_PERCENT` com evidência executável — nunca por um subagente declarar "deveria funcionar" sem validação determinística.

---

## Sobre as 10 playbooks de análise — resumo

São 10 playbooks de análise **originais**, escritos para este projeto — nenhuma
é uma redistribuição de um pacote oficial da Salesforce ou de terceiros
(nenhum dos 10 nomes existe no repositório real `forcedotcom/sf-skills`; uma
versão anterior deste README afirmava o contrário por engano e foi corrigida):

- **6 de análise**: `apex-analyzer`, `flow-inspector`, `lwc-extractor`, `integration-contract-builder`, `well-architected-checker`, `apex-governor-limits-validator`
- **2 de catalogação**: `salesforce-metadata-cataloger`, `flow-surveyor`
- **2 de visualização**: `arcfile-generator`, `c4-modeler`

Nenhuma decide sozinha — são documentos de referência que os subagentes consultam por caminho.

---

## Rodadas de consistência aplicadas

Esta skill passou por 6 ciclos de verificação com subagentes paralelos:

| Ciclo | Foco | Resultado |
|-------|------|-----------|
| 1 | Estrutural | 5 arquivos principais, 10 skills, 3 comandos |
| 2 | Cross-references | 11 refs subagentes, 8 skills, 12 Source Linkage, 7 standards |
| 3 | Conteúdo crítico | 13 menções fases, 8 params loop, 3 hooks, 12 paths |
| 4 | Conteúdo profundo | Todos 5 arquivos: Missão, Integração, Standards, Source Linkage |
| 5 | Playbooks de análise | Todas 10 com SKILL.md, Interface, Entrada/Saída JSON |
| 6 | Comandos slash | Todos 3 com description + argument-hint |
| 7 | Scripts determinísticos | `lwc-apex-callgraph.mjs` (call-graph LWC→Apex) e `audit-cache.mjs` (cache incremental do Audit Loop), cada um com selftest fail-closed contra fixture de verdade conhecida |
| 8 | Conformidade estrutural Anthropic | Corrigido campo `tools:` inválido (era ignorado silenciosamente) em 11/11 `SKILL.md` — o campo correto para Skills é `allowed-tools`, `tools:` é campo de subagente. Os 4 "subagentes" viviam sem frontmatter dentro de `.claude/skills/sf-archaeologist/` (inertes como subagentes reais); movidos para `.claude/agents/*.md` com `name`+`description` válidos. Corrigida atribuição residual "forcedotcom/sf-skills, Apache-2.0" que uma rodada anterior já tinha corrigido em outros arquivos mas não neste README. Adicionados `AGENTS.md`, `CLAUDE.md`, `LICENSE` (MIT), `.gitignore` e `evaluations/evals.json` da skill principal (4 cenários de regressão comportamental) |

---

<p align="center">
  ⭐ <b><a href="https://github.com/brunotrolo/Salesforce_Archaeologist/stargazers">Dê uma star no repo</a></b> para ser avisado quando novas skills e melhorias saírem.
</p>

---

## Resumo — input, o que faz, o que entrega

| | |
|---|---|
| **Input** | Uma org Salesforce no formato **SFDX Source** (`force-app/main/default`) — metadados, Apex, LWC, Flows, objetos, automações, permissões, integrações. Não requer documentação prévia; a skill extrai tudo do código e metadados. |
| **O que faz** | Executa engenharia reversa completa em 4 fases incrementais com loop de validação determinística: 1) **Survey** — varredura rasa KDM/AST de 100% da org; 2) **Deep Dive** — escavação SBAR/Graph Engine em 5 níveis (Triggering Context → Validation Gateways → State Mutation → Outbound Integrations → Post-Processing); 3) **Audit Loop** — reconciliação 1:1 via `rg`/`find` + Well-Architected scoring até `VERIFIED_100_PERCENT`; 4) **Model** — síntese C4/Arcfile (Sequence, ERD, Target Architecture). |
| **Entrega** | `docs/archaeologist/CAPABILITIES_MAP.md` (inventário global), `journeys/<jornada>.md` e `technical/<alvo>.md` (documentação com Source Linkage `arquivo:linha`), `diagrams/<jornada>.{arc,svg,html,webm}` (diagramas validados), assessment técnico com scoring Well-Architected e roadmap de modernização (fflib, WF/PB→Flow, Event-Driven, API-Led). |

---

## Relacionado

- **[Salesforce Journey Designer](https://github.com/brunotrolo/Salesforce_Journey_Designer)** — Skill irmã que especifica, desenha e prototipa jornadas; o Archaeologist faz a engenharia reversa do que já existe
- **[Salesforce Journey Developer](https://github.com/brunotrolo/Salesforce_Journey_Developer)** — Constrói e deploya o que o Designer especifica