---
name: salesforce-metadata-cataloger
description: Playbook de análise Salesforce para catálogo preciso de metadados: classificação de versões de API, tipos de componente, dependências, status de deployment, distinção legados vs modernos. Use SEMPRE na fase de survey para inventário exato.
tools:
  - read_file
  - search_files
  - run_command
---

# Salesforce Official Skill: Salesforce Metadata Cataloger

## Missão
Classificar e catalogar 100% dos metadados Salesforce no formato Source (SFDX) com precisão de versão, tipo, status e dependências.

## Capacidades Principais

### 1. Classificação por Tipo de Metadado
Mapeamento completo `Metadata API Name` → `Source Format Path` → `Categoria KDM`:

| Metadata Type | Source Path | KDM Layer | Moderno/Legado |
|---------------|-------------|-----------|----------------|
| ApexClass | apex-classes/ | Structure | Moderno |
| ApexTrigger | triggers/ | Structure | Moderno |
| Flow | flows/ | Behavior | Moderno (v58+) |
| ProcessBuilder | flows/ (ProcessType=Workflow) | Behavior | **Legado** |
| WorkflowRule | objects/*/workflowRules/ | Behavior | **Legado** |
| ValidationRule | objects/*/validationRules/ | Data | Moderno |
| CustomObject | objects/ | Data | Moderno |
| CustomField | objects/*/fields/ | Data | Moderno |
| PermissionSet | permissionSets/ | Platform | Moderno |
| Profile | profiles/ | Platform | Moderno |
| NamedCredential | namedCredentials/ | Integration | Moderno |
| ExternalCredential | externalCredentials/ | Integration | Moderno |
| RemoteSiteSetting | remoteSiteSettings/ | Integration | Legado |
| CSPTrustedSite | cspTrustedSites/ | Integration | Moderno |
| LightningComponentBundle | lwc/ | Interface | Moderno |
| AuraDefinitionBundle | aura/ | Interface | Legado |
| VisualforcePage | pages/ | Interface | Legado |
| CustomMetadata | customMetadata/ | Data | Moderno |
| CustomSetting | customSettings/ | Data | Legado/Modern |
| EmailTemplate | email/ | Interface | Moderno |

### 2. Versão de API & Compatibilidade
- Extrair `apiVersion` de cada `-meta.xml`
- Alertar se `< 55.0` (Winter '23) - riscos de depreciação
- Identificar metadados sem `-meta.xml` (orfãos)

### 3. Status de Deployment & Ativação
- **Apex**: `status` (Active/Inactive) no `-meta.xml`
- **Flow**: `FlowDefinitionView.Status` (Active/Obsolete/Deleted)
- **Trigger**: `status` (Active/Inactive)
- **ValidationRule**: `active` (true/false)
- **ProcessBuilder**: `active` (true/false) + `ProcessType`

### 4. Dependências & Referências Cruzadas
- **Apex → Object/Field**: `Schema.SObjectType`, `Schema.sObjectField`
- **Apex → Flow**: `Flow.Interview`, `InvocableMethod`
- **Flow → Apex**: `Action` com `InvocableMethod`
- **Flow → Flow**: `Subflow` element
- **LWC → Apex**: `@wire(apexMethod)`, `import ... from '@salesforce/apex/'`
- **Trigger → Handler**: Instanciação de classe no trigger body
- **PermissionSet → Apex**: `classAccesses` em permSet-meta.xml
- **NamedCredential → Apex**: `callout:NC_Name` em HttpRequest

### 5. Detecção de Legado vs Moderno
| Legado (Migração Recomendada) | Moderno (Target) |
|-------------------------------|------------------|
| Workflow Rules | Record-Triggered Flow (BeforeSave) |
| Process Builder | Record-Triggered Flow (AfterSave) |
| Aura Components | LWC |
| Visualforce Pages | LWC / Experience Cloud |
| Custom Settings (List) | Custom Metadata Types |
| `@future` (primitive only) | Queueable (stateful) / Batchable |
| `sforce.connection` (JS) | LWC `@wire` / `lightning/ui*Api` |

## Interface de Uso (para @sf-surveyor)

### Entrada
```json
{
  "root_path": "force-app/main/default",
  "include_inactive": true,
  "categorize_legacy": true
}
```

### Saída Esperada
```json
{
  "summary": {
    "total_files": 2847,
    "by_kdm_layer": {
      "Structure": 456,
      "Data": 1234,
      "Behavior": 312,
      "Interface": 289,
      "Integration": 67,
      "Platform": 489
    },
    "by_modernity": {
      "Modern": 2100,
      "Legacy": 747
    },
    "api_versions": {
      "60.0": 1200,
      "59.0": 800,
      "58.0": 500,
      "57.0": 200,
      "<55.0": 147
    }
  },
  "inventory": [
    {
      "type": "ApexClass",
      "name": "PropostaService",
      "path": "force-app/main/default/classes/PropostaService.cls",
      "api_version": 60.0,
      "status": "Active",
      "kdm_layer": "Structure",
      "annotations": ["AuraEnabled", "InvocableMethod"],
      "dependencies": ["Account", "Proposta_Credito__c", "SerasaIntegration"],
      "modernity": "Modern"
    },
    {
      "type": "Flow",
      "name": "OnboardingPJ_RecordTriggered",
      "path": "force-app/main/default/flows/OnboardingPJ_RecordTriggered.flow-meta.xml",
      "api_version": 59.0,
      "status": "Active",
      "process_type": "RecordTriggeredFlow",
      "trigger_type": "AfterSave",
      "object": "Account",
      "kdm_layer": "Behavior",
      "subflows": ["CalculoScore_Autolaunched"],
      "invocable_methods": ["SerasaIntegration.consultarSerasa"],
      "modernity": "Modern"
    },
    {
      "type": "WorkflowRule",
      "name": "Account_Atualiza_Status",
      "path": "force-app/main/default/objects/Account/workflowRules/Account_Atualiza_Status.workflow-meta.xml",
      "api_version": 52.0,
      "status": "Active",
      "object": "Account",
      "kdm_layer": "Behavior",
      "modernity": "LEGACY",
      "migration_target": "Record-Triggered Flow (BeforeSave)"
    }
  ],
  "cross_references": {
    "apex_to_object": { "PropostaService": ["Account", "Proposta_Credito__c", "Documento_Proposta__c"] },
    "flow_to_apex": { "OnboardingPJ_RecordTriggered": ["SerasaIntegration.consultarSerasa"] },
    "lwc_to_apex": { "propostaWizard": ["PropostaController.iniciarOnboarding", "DocumentoController.uploadDocumento"] },
    "trigger_to_handler": { "AccountTrigger": "AccountTriggerHandler" }
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-surveyor` na Fase 1 (Reconhecimento KDM) - **obrigatória**
- Fornece inventário base para `CAPABILITIES_MAP.md`
- Classificação Moderno/Legado alimenta `@sf-architect` para Target Architecture
- Dependências cruzadas alimentam `@sf-deep-diver` para rastreamento de grafos
- Versões de API < 55.0 → flag Well-Architected (Easy pillar)