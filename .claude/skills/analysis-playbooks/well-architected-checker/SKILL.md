---
name: well-architected-checker
description: Playbook de análise Salesforce para avaliação de conformidade com Well-Architected Framework (Trusted, Easy, Adaptable). Scoring automatizado, detecção de violações, recomendações de modernização. Use SEMPRE que precisar auditar qualidade arquitetural e débito técnico.
---

# Playbook de Análise: Well-Architected Checker

## Missão
Avaliar código e configuração Salesforce contra os 3 pilares do Well-Architected Framework, fornecendo scoring quantitativo e recomendações acionáveis.

## Pilares & Critérios de Avaliação

### 1. Trusted (Confiável) - Segurança & Governança
| Critério | Verificação | Peso |
|----------|-------------|------|
| **CRUD/FLS Enforcement** | `with sharing`, `Security.stripInaccessible`, `isAccessible()` | 25% |
| **Named Credentials** | Callouts usam NC vs hardcoded endpoints | 20% |
| **SOQL Injection Prevention** | Bind variables vs concatenação em `Database.query` | 15% |
| **Encryption at Rest** | Platform Encryption, Shield, Field Audit Trail | 10% |
| **Secrets Management** | Nenhum segredo em código (Named Credential, Custom Metadata) | 15% |
| **Sharing Model** | OWD, Sharing Rules, Apex managed sharing, `inherited sharing` | 15% |

### 2. Easy (Simples) - Manutenibilidade & Clareza
| Critério | Verificação | Peso |
|----------|-------------|------|
| **Trigger Handler Pattern** | Triggers delegam para handler class (fflib Domain) | 20% |
| **Test Quality** | Cobertura > 75%, `System.assert*`, isolamento de dados | 20% |
| **Code Modularity** | Classes < 500 linhas, métodos < 50 linhas, SRP | 15% |
| **Naming Conventions** | Padrões oficiais (Selector, Domain, Service, Controller) | 10% |
| **Documentation** | JavaDoc/JSdoc, comentários de negócio, README | 10% |
| **Deprecated APIs** | Uso de APIs obsoletas (Workflow, Process Builder, `sforce.connection`) | 10% |
| **Code Duplication** | Métodos idênticos, lógica replicada (copy-paste) | 15% |

### 3. Adaptable (Adaptável) - Resiliência & Escalabilidade
| Critério | Verificação | Peso |
|----------|-------------|------|
| **Bulkification** | Zero SOQL/DML em loops, coleções processadas em batch | 25% |
| **Async Patterns** | @future/Queueable/Batch para processamento pesado | 20% |
| **Governor Limit Headroom** | SOQL < 80, DML < 120, CPU < 80% do limite | 20% |
| **Event-Driven** | Platform Events, CDC, Pub/Sub vs polling/tight coupling | 15% |
| **Feature Flags** | Custom Metadata/Feature Management para toggles | 10% |
| **API-Led Connectivity** | System/Process/Experience APIs, External Services | 10% |

## Scoring
- **90-100**: Exemplar (Referência)
- **75-89**: Bom (Conforme)
- **60-74**: Aceitável (Melhorias recomendadas)
- **40-59**: Risco (Ação necessária)
- **<40**: Crítico (Bloqueador para migração)

## Interface de Uso (para @sf-auditor)

### Entrada
```json
{
  "scope": "force-app/main/default",
  "context": "jornada-onboarding-pj",
  "doc_validated": "docs/archaeologist/journeys/onboarding-pj.md",
  "pillars": ["Trusted", "Easy", "Adaptable"]
}
```

### Saída Esperada
```json
{
  "overall_score": 72,
  "pillar_scores": {
    "Trusted": 85,
    "Easy": 72,
    "Adaptable": 68
  },
  "violations": [
    {
      "pillar": "Trusted",
      "criteria": "CRUD/FLS Enforcement",
      "severity": "HIGH",
      "file": "PropostaController.cls",
      "line": 45,
      "code": "public with sharing class PropostaController { ... insert proposta; }",
      "issue": "DML sem verificação isCreateable() antes de insert",
      "recommendation": "Adicionar Schema.sObjectType.Proposta_Credito__c.isCreateable() check"
    },
    {
      "pillar": "Adaptable",
      "criteria": "Bulkification",
      "severity": "HIGH",
      "file": "PropostaService.cls",
      "line": 112,
      "code": "for (Proposta_Credito__c p : propostas) { List<Task> tasks = [SELECT Id FROM Task WHERE WhatId = :p.Id]; }",
      "issue": "SOQL dentro de loop - risco de limite 100 queries",
      "recommendation": "Query única fora do loop com Map<Id, List<Task>>"
    }
  ],
  "modernization_recommendations": [
    {
      "area": "Automation Migration",
      "current": "Workflow Rule + Process Builder + Record-Triggered Flow em Account",
      "target": "Consolidar em único Record-Triggered Flow (BeforeSave + AfterSave)",
      "effort": "MEDIUM",
      "priority": "HIGH"
    },
    {
      "area": "Apex Architecture",
      "current": "Triggers com lógica inline, Services com SOQL direto",
      "target": "Adotar fflib: Selector + Domain + Service + UnitOfWork",
      "effort": "HIGH",
      "priority": "HIGH"
    },
    {
      "area": "Integration",
      "current": "Callouts diretos em Service, retry manual",
      "target": "Integration Gateway pattern + Circuit Breaker + Queueable retry",
      "effort": "MEDIUM",
      "priority": "MEDIUM"
    }
  ]
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-auditor` na verificação de Débito Técnico (Well-Architected Check)
- Scoring alimenta relatório final de assessment
- Recomendações alimentam `@sf-architect` para Target Architecture (C1/C2)
- Violações de severidade HIGH/CRITICAL → falham auditoria se não mitigadas