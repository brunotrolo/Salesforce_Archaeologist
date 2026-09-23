---
description: Executa deep dive em jornada, tipo técnico ou objeto (Fase 2+3 - Escavação SBAR + Loop Auditoria)
argument-hint: <jornada|tipo-tecnico|objeto>
---

# Deep Dive Salesforce

Executa as Fases 2 e 3 do Salesforce Archaeologist: escavação profunda (SBAR & Graph Engine) com loop de validação determinística até `VERIFIED_100_PERCENT`.

## Alvos Suportados

### Jornadas de Negócio
```
/archaeologist dig onboarding-pj
/archaeologist dig checkout
/archaeologist dig renovacao-contrato
```

### Tipos Técnicos
```
/archaeologist dig callouts
/archaeologist dig lwc
/archaeologist dig triggers
/archaeologist dig flows
/archaeologist dig validation-rules
```

### Objetos Core
```
/archaeologist dig Account
/archaeologist dig Proposta_Credito__c
/archaeologist dig Opportunity
```

## O que faz (Loop Fechado)

### Fase 2: @sf-deep-diver (SBAR - 5 Níveis)
1. **Triggering Context**: Entry points (LWC, Apex, Flow, Event, Scheduled)
2. **Validation Gateways**: VRs, addError, Flow Decisions, Custom Permissions, Sharing
3. **State Mutation**: DML, Database methods, UoW, Flow Data Elements, Bulkification
4. **Outbound Integrations**: Contratos literais de callout (endpoint, payload, retry, error handling)
5. **Post-Processing**: @future, Queueable, Batchable, Platform Events, Email

### Fase 3: @sf-auditor (Loop Determinístico)
- Contagem exata via `rg`/`find`: callouts, VRs, DML, SOQL, triggers, flows, LWC→Apex
- Well-Architected scoring: Trusted, Easy, Adaptable
- Se `REJECTED`: retorna `missing_artifacts` + `instructions_to_deep_diver` → reexecuta Fase 2
- Loop até `VERIFIED_100_PERCENT` (máx 5 iterações)

## Pré-requisitos

- **Obrigatório**: `docs/archaeologist/CAPABILITIES_MAP.md` existir (Fase 1 concluída)
- Org no formato SFDX Source

## Saída Esperada

```
docs/archaeologist/journeys/<alvo>.md        # Para jornadas
docs/archaeologist/technical/<alvo>.md       # Para tipos técnicos/objetos

Estrutura (ex: jornada):
├── 1. Entry Points (com Source Linkage)
├── 2. Validation Gateways (tabela com arquivo:linha)
├── 3. State Mutations (tabela DML com contexto)
├── 4. Callouts (contratos OpenAPI-like completos)
└── 5. Async Post-Processing (grafo assíncrono)
```

## Uso

```
/archaeologist dig onboarding-pj
/archaeologist dig callouts
/archaeologist dig Account
```

## Playbooks Acionadas

- `apex-analyzer` - Disseca corpo de métodos Apex
- `lwc-extractor` - Mapeia @wire, @api, eventos, imports Apex
- `integration-contract-builder` - Extrai contratos de callout
- `well-architected-checker` - Scoring 3 pilares
- `apex-governor-limits-validator` - Análise quantitativa limites