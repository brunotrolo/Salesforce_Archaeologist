---
name: apex-analyzer
description: "Playbook de análise Salesforce para análise profunda de código Apex: detecção de antipatterns, governor limits, SOQL/DML em loops, hardcoded IDs, cobertura de testes, padrões fflib. Use SEMPRE que precisar dissecar corpo de métodos Apex, identificar vulnerabilidades ou avaliar qualidade de código."
---

# Playbook de Análise: Apex Analyzer

## Missão
Fornecer análise estática especializada de código Apex com conhecimento profundo de runtime Salesforce, governor limits e padrões enterprise (fflib).

## Capacidades Principais

### 1. Detecção de Antipatterns (PMD + Graph Engine)
- SOQL dentro de loops `for`
- DML dentro de loops `for`
- Hardcoded IDs (15/18 chars: `001...`, `00D...`, `005...`)
- Queries sem WHERE (table scans)
- Variáveis não utilizadas
- Métodos excessivamente longos (>50 linhas)
- Complexidade ciclomática alta (>10)

### 2. Análise de Governor Limits
- Contagem estimada de SOQL/DML por caminho de execução
- CPU time risk (nested loops, large collections)
- Heap size risk (large collections, JSON serialization)
- Callout count e timeout risk

### 3. Padrões fflib (Apex Enterprise Patterns)
- Identificação de camadas: Selector, Domain, Service, UnitOfWork
- Verificação de conformidade: SOQL apenas em Selectors, DML apenas via UoW
- Detecção de "Service" fazendo query direta (violação)
- Detecção de "Domain" sem trigger handler pattern

### 4. Cobertura e Qualidade de Testes
- Classes sem `@isTest`
- Métodos de teste sem `System.assert*`
- `Test.startTest()` / `Test.stopTest()` ausentes
- `SeeAllData=true` (anti-pattern)
- Testes que não isolam dados

### 5. Security Review
- CRUD/FLS enforcement (`with sharing`, `Security.stripInaccessible`)
- SOQL Injection (`Database.query` com concatenação)
- XSS em Visualforce/LWC (escape inadequado)
- Named Credential usage vs hardcoded endpoints

## Interface de Uso (para @sf-deep-diver)

### Entrada
```json
{
  "scope": "force-app/main/default/classes/PropostaService.cls",
  "analysis_type": "full", // "full" | "governor_limits" | "security" | "fflib" | "test_quality"
  "context": "jornada-onboarding-pj"
}
```

### Saída Esperada
```json
{
  "file": "PropostaService.cls",
  "findings": [
    {
      "type": "SOQL_IN_LOOP",
      "severity": "HIGH",
      "line": 112,
      "code": "for (Account a : accounts) { List<Contact> cs = [SELECT Id FROM Contact WHERE AccountId = :a.Id]; }",
      "recommendation": "Mover query para fora do loop, usar Map<Id, List<Contact>>"
    },
    {
      "type": "HARDCODED_ID",
      "severity": "MEDIUM",
      "line": 45,
      "code": "Profile p = [SELECT Id FROM Profile WHERE Id = '00e123456789012'];",
      "recommendation": "Usar Schema.Profile.getSObjectType().getDescribe() ou Custom Metadata"
    }
  ],
  "governor_risk": {
    "soql_estimate": 15,
    "dml_estimate": 8,
    "cpu_risk": "MEDIUM",
    "heap_risk": "LOW"
  },
  "fflib_compliance": {
    "layer": "SERVICE",
    "violations": ["Direct SOQL in Service layer - should use Selector"],
    "score": 65
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-deep-diver` no Nível 3 (State Mutation) e Nível 4 (Callouts)
- Resultados alimentam `@sf-auditor` para validação de Well-Architected
- Referenciada em `salesforce-standards.md` seção 8 (Anti-Patterns)