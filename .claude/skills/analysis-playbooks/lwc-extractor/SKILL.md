---
name: lwc-extractor
description: Playbook de análise Salesforce para extração e análise de Lightning Web Components: decorators (@api, @wire, @track), chamadas imperativas a Apex, eventos customizados, lifecycle hooks, composição de componentes. Use SEMPRE que precisar mapear onde a jornada começa na interface do usuário.
tools:
  - read_file
  - search_files
  - run_command
---

# Salesforce Official Skill: LWC Extractor

## Missão
Analisar componentes Lightning Web Components para mapear pontos de entrada da UI, chamadas a backend (Apex), fluxo de dados reativo e eventos de comunicação entre componentes.

## Capacidades Principais

### 1. Decorators & Propriedades Reativas
- `@api`: Propriedades públicas (pai → filho), métodos públicos
- `@track`: Propriedades privadas reativas (objetos/arrays - auto-tracking em API 45+)
- `@wire`: Wire adapters (getRecord, getObjectInfo, getPicklistValues, Apex cacheable)
- `@wire(apexMethod)`: Chamadas reativas a Apex (somente leitura, cacheable=true)

### 2. Chamadas Imperativas a Apex
- `import methodName from '@salesforce/apex/Namespace.Class.method'`
- Padrão Promise: `.then()` / `.catch()` ou `async/await`
- Parâmetros: Serialização automática (primitivos, sObjects, coleções)
- Retorno: Tipado via TypeScript/JSDoc

### 3. Wire Adapters Nativos
| Adapter | Uso | Reativo |
|---------|-----|---------|
| `getRecord` | Dados de registro (fields) | Sim |
| `getRecordNotify` | Notificações de mudança | Sim |
| `getObjectInfo` | Metadados do objeto | Sim |
| `getPicklistValues` | Valores de picklist | Sim |
| `getRecordUi` | UI completa (layout, actions) | Sim |
| `createRecord` | Criar registro (form) | Não (imperativo) |
| `updateRecord` | Atualizar registro | Não (imperativo) |
| `deleteRecord` | Deletar registro | Não (imperativo) |

### 4. Eventos Customizados (Comunicação Pai-Filho / Irmãos)
- `CustomEvent(eventName, { detail, bubbles, composed })`
- `dispatchEvent(event)`
- Padrão: `bubbles: true, composed: true` para atravessar shadow DOM
- Naming: `lowercase` (ex: `propostacreated`, `stepchanged`)

### 5. Lifecycle Hooks
- `constructor()`: Inicialização, setup de propriedades
- `connectedCallback()`: Inserido no DOM → **carregar dados, subscribe eventos**
- `renderedCallback()`: Após render → **evitar side effects, usar para métricas**
- `disconnectedCallback()`: Removido do DOM → **cleanup, unsubscribe**
- `errorCallback(error, stack)`: Error boundary (pai captura erro do filho)

### 6. Composição & Slots
- `<slot>`: Projeção de conteúdo (pai → filho)
- `<slot name="header">`: Named slots
- `this.template.querySelector('slot')`: Acesso programático

### 7. Acesso a Dados & Serviços
- `@salesforce/apex`: Controllers Apex
- `@salesforce/schema`: Import de objetos/campos (type-safe)
- `@salesforce/label`: Custom Labels
- `@salesforce/i18n`: Locale, timezone, currency
- `@salesforce/user`: User context (Id, permissions)
- `@salesforce/resourceUrl`: Static Resources
- `lightning/platformResourceLoader`: Load scripts/CSS externos
- `lightning/navigation`: NavigationMixin (Navigate, GenerateUrl)

## Interface de Uso (para @sf-deep-diver)

### Entrada
```json
{
  "scope": "force-app/main/default/lwc/propostaWizard",
  "analysis_type": "full", // "full" | "apex_calls" | "wire_adapters" | "events" | "lifecycle"
  "context": "jornada-onboarding-pj"
}
```

### Saída Esperada
```json
{
  "component": "propostaWizard",
  "api_properties": [
    { "name": "recordId", "type": "String", "required": true },
    { "name": "mode", "type": "String", "default": "create" }
  ],
  "wire_adapters": [
    {
      "property": "accountRecord",
      "adapter": "getRecord",
      "params": { "recordId": "$recordId", "fields": ["Account.Name", "Account.CNPJ__c", "Account.Status_Onboarding__c"] },
      "cacheable": true
    },
    {
      "property": "propostas",
      "adapter": "apexMethod",
      "method": "PropostaController.getPropostasByAccount",
      "params": { "accountId": "$recordId" },
      "cacheable": true
    }
  ],
  "apex_calls_imperative": [
    {
      "method": "PropostaController.iniciarOnboarding",
      "params": ["cnpj", "valorSolicitado", "prazoMeses"],
      "called_from": "handleSubmit",
      "error_handling": "try/catch com toast notification"
    },
    {
      "method": "DocumentoController.uploadDocumento",
      "params": ["file", "propostaId", "tipoDocumento"],
      "called_from": "handleFileUpload"
    }
  ],
  "events_emitted": [
    { "name": "propostacreated", "detail": "{ propostaId, status }", "bubbles": true },
    { "name": "stepchanged", "detail": "{ step: 2 }", "bubbles": true }
  ],
  "events_handled": [
    { "name": "documentuploaded", "handler": "onDocumentUploaded" }
  ],
  "lifecycle_usage": {
    "connectedCallback": "Carrega accountRecord via wire, inicializa wizard state",
    "renderedCallback": "Analytics tracking (page view)",
    "disconnectedCallback": "Limpa event listeners customizados"
  },
  "composition": {
    "slots_used": ["header", "footer"],
    "child_components": ["inputCNPJ", "documentUploader", "wizardStepper"]
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-deep-diver` no Nível 1 (Triggering Context - UI-Driven)
- Mapeia `@wire(getRecord)` → entry points de jornada
- Extrai chamadas Apex imperativas → vincula a métodos @AuraEnabled no backend
- Eventos customizados → rastreia fluxo entre componentes na jornada
- Resultados alimentam `@sf-architect` para Sequence Diagram (Actor → LWC → Apex)