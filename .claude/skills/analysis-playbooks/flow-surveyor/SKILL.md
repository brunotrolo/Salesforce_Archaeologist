---
name: flow-surveyor
description: Playbook de análise Salesforce para survey rápido de Flows: extração de FlowDefinitionView, status ativo/obsoleto, tipo de flow, objeto gatilho, trigger type, contagem de elementos. Use SEMPRE na fase de survey para inventário de automações sem ler XML completo.
tools:
  - read_file
  - search_files
  - run_command
---

# Salesforce Official Skill: Flow Surveyor

## Missão
Executar survey rápido (raso) de todos os Flows da org via FlowDefinitionView e metadados de cabeçalho, sem processar XML completo dos nodes.

## Capacidades Principais

### 1. FlowDefinitionView Query (SOQL)
```sql
SELECT Id, MasterLabel, Description, Status, ProcessType, TriggerType, 
       ObjectType, CreatedDate, LastModifiedDate, VersionNumber,
       IsTemplate, TemplateId, NamespacePrefix
FROM FlowDefinitionView
WHERE Status = 'Active' OR Status = 'Obsolete'
ORDER BY ProcessType, ObjectType, MasterLabel
```

### 2. Classificação Rápida por ProcessType
| ProcessType | Label | TriggerType | Uso |
|-------------|-------|-------------|-----|
| `RecordTriggeredFlow` | Record-Triggered | `BeforeSave` / `AfterSave` | Automação em objeto |
| `AutolaunchedFlow` | Autolaunched | N/A | Subflow, Apex, REST |
| `Flow` | Screen Flow | N/A | UI guiada |
| `ScheduledFlow` | Scheduled | N/A | Agendado (cron) |
| `ContactRequestFlow` | Contact Request | N/A | Omni-Channel |
| `UserProvisioningFlow` | User Provisioning | N/A | SCIM/JIT |

### 3. Metadados de Cabeçalho (sem XML completo)
Do arquivo `.flow-meta.xml`:
- `apiVersion`
- `status` (Active/Obsolete/Deleted)
- `processType`
- `triggerType` (se RecordTriggered)
- `objectType` (se RecordTriggered)
- `label` / `description`
- `interviewLabel` (para debug)

### 4. Contagem de Elementos (via regex no XML - opcional)
- `recordCreate` / `recordUpdate` / `recordDelete` / `recordLookup` → Data Elements
- `decision` → Decision nodes
- `loop` → Loops
- `subflow` → Subflow calls
- `action` → Apex Actions (@InvocableMethod), Email, etc.
- `screen` → Screen elements (Screen Flow)

### 5. Detecção de Conflitos (Survey Level)
- Múltiplos Record-Triggered Flows no mesmo objeto (BeforeSave + AfterSave)
- Flow + Trigger + PB + WF no mesmo objeto
- Flows Obsoletos mas referenciados (Subflow, Action)
- Flows sem versão ativa (todas Obsolete)

## Interface de Uso (para @sf-surveyor)

### Entrada
```json
{
  "org_connection": "<seu-org-alias>", // alias da org
  "include_obsolete": true,
  "count_elements": true, // via regex, rápido
  "detect_conflicts": true
}
```

### Saída Esperada
```json
{
  "total_flows": 47,
  "active": 42,
  "obsolete": 5,
  "by_process_type": {
    "RecordTriggeredFlow": 28,
    "AutolaunchedFlow": 12,
    "Flow": 5,
    "ScheduledFlow": 2
  },
  "by_object": {
    "Account": { "BeforeSave": 2, "AfterSave": 3 },
    "Proposta_Credito__c": { "BeforeSave": 1, "AfterSave": 2 },
    "Opportunity": { "AfterSave": 1 }
  },
  "flows_detail": [
    {
      "id": "300xxxxxxxxxxxx",
      "label": "OnboardingPJ_RecordTriggered",
      "api_name": "OnboardingPJ_RecordTriggered",
      "status": "Active",
      "process_type": "RecordTriggeredFlow",
      "trigger_type": "AfterSave",
      "object": "Account",
      "api_version": 59.0,
      "element_counts": {
        "decisions": 3,
        "assignments": 5,
        "loops": 1,
        "data_elements": { "create": 1, "update": 1, "delete": 0, "get": 2 },
        "subflows": 1,
        "actions": 2,
        "screens": 0
      },
      "subflows_called": ["CalculoScore_Autolaunched"],
      "invocable_actions": ["SerasaIntegration.consultarSerasa"],
      "conflicts": [
        "AccountTrigger (after update) também roda em Account - ordem execução não determinística"
      ]
    }
  ],
  "legacy_automation": {
    "workflow_rules_active": 8,
    "process_builders_active": 3,
    "objects_with_mixed_automation": ["Account", "Opportunity"],
    "migration_candidates": [
      { "object": "Account", "legacy": ["WF_Rule_1", "PB_Account_Update"], "target": "Consolidar em Record-Triggered Flow" }
    ]
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-surveyor` na Fase 1 - complementa `salesforce-metadata-cataloger`
- Fornece contagem exata de flows ativos por objeto para `CAPABILITIES_MAP.md`
- Conflitos detectados → alimentam `@sf-auditor` (Well-Architected Easy pillar)
- Subflows/InvocableActions → mapeiam dependências para `@sf-deep-diver`
- Objetos com automação mista → prioridade para `@sf-deep-diver` escavar