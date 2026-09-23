---
description: Gera diagramas Arcfile/C4 validados (Fase 4 - Síntese Arquitetural)
argument-hint: <jornada>
---

# Model Salesforce Architecture

Executa a Fase 4 do Salesforce Archaeologist: síntese visual C4 & Arcfile a partir de documentação validada (`VERIFIED_100_PERCENT`).

## Pré-requisito Obrigatório

**NÃO EXECUTA** sem documento validado pelo @sf-auditor:
- Requer `audit_status: "VERIFIED_100_PERCENT"` no JSON de auditoria
- Documento fonte em `docs/archaeologist/journeys/<jornada>.md` ou `technical/<alvo>.md`

## O que faz

### @sf-architect gera 3 tipos de diagrama:

#### 1. Sequence Diagram (C3/C4)
- Fluxo completo: Actor → LWC → Apex Controller → Service → Domain/Selector → Integration Gateway → Named Credential → External System
- Happy Path + 2+ fluxos de exceção (4xx, 5xx, Timeout, Governor Limits)
- Formato Arcfile `sequence`

#### 2. ERD - Entity Relationship Diagram (C3/C4)
- Apenas objetos do escopo validado
- Cardinalidades (1:N, N:M), chaves estrangeiras, campos de status, auditoria
- Formato Arcfile `er`

#### 3. Target Architecture (C1/C2)
- Refatoração para fflib: Selector, Domain, Service, UnitOfWork
- Migração legados: WF/PB → Record-Triggered Flow, Aura → LWC
- Event-Driven: Platform Events, CDC, Pub/Sub
- API-Led: System/Process/Experience APIs
- Formato Arcfile `architecture`

### Exportação Multi-formato (via `arcfile-generator`)
- `.arc` - Especificação fonte
- `.svg` - Documentação estática
- `.html` - Interativo (zoom, dark/light, tooltips com Source Linkage)
- `.webm` - Animação sequence diagram (trace motion)
- `.mermaid` - Fallback GitHub/Notion

## Saída Esperada

```
docs/archaeologist/diagrams/<jornada>.arc
docs/archaeologist/diagrams/<jornada>.svg
docs/archaeologist/diagrams/<jornada>.html
docs/archaeologist/diagrams/<jornada>.webm
```

## Uso

```
/archaeologist model onboarding-pj
```

## Playbooks Acionadas

- `arcfile-generator` - Validação sintaxe, compilação, exportação
- `c4-modeler` - Verificação conformidade C4 Model (Simon Brown)

## Critérios de Qualidade

- [ ] Diagramas compilam sem erro no Archify
- [ ] Sequence cobre happy path + 2+ exceções
- [ ] ERD apenas objetos do escopo
- [ ] Target Architecture propõe fflib concretos
- [ ] Source Linkage referenciado (arquivo:linha)
- [ ] Nomes consistentes com CAPABILITIES_MAP.md