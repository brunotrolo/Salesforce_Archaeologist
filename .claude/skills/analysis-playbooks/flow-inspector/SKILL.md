---
name: flow-inspector
description: Playbook de análise Salesforce para inspeção profunda de Flows: decifrar XML complexo de FlowDefinition/Flow Metadata, traduzir nós de decisão, loops, subflows, @InvocableMethod calls, mapear conflitos de ordem de execução. Use SEMPRE que precisar analisar automações declarativas.
tools:
  - read_file
  - search_files
  - run_command
---

# Salesforce Official Skill: Flow Inspector

## Missão
Decifrar metadados XML de Flows (FlowDefinitionView + Flow Metadata) e traduzir em regras de negócio legíveis, identificando conflitos de execução e dependências.

## Capacidades Principais

### 1. Parsing de Flow Metadata XML
- **FlowDefinitionView**: Status (Active/Obsolete), ProcessType, TriggerType, Object
- **Flow Metadata**: Nodes (Start, Decision, Assignment, Loop, Screen, Action, Subflow, Data Elements)
- **Connectors**: Fluxo entre nodes, condições de decisão
- **Variables**: Input/Output, Collection, Record, Record Collection
- **Formulas**: Expressões em Decision/Assignment

### 2. Tipos de Flow & Comportamento
| ProcessType | TriggerType | Comportamento |
|-------------|-------------|---------------|
| RecordTriggeredFlow | BeforeSave | Fast Field Updates, antes commit, sem DML extra |
| RecordTriggeredFlow | AfterSave | Após commit, DML/callout/email permitido |
| AutolaunchedFlow | N/A | Chamado via Apex/Subflow/REST |
| Flow (Screen) | N/A | Interface guiada usuário |
| ScheduledFlow | N/A | Execução agendada (cron) |

### 3. Mapeamento de Lógica de Negócio
- **Decisions**: Traduzir outcomes em regras IF/ELSE legíveis
- **Loops**: Identificar collection variable, iterador, elementos internos
- **Assignments**: Mapear transformações de variáveis
- **Data Elements**: Create/Update/Delete/Get Records → mapear para DML/SOQL equivalente
- **Subflows**: Rastrear chamadas a outros flows (Autolaunched)
- **Actions**: @InvocableMethod, Send Email, Quick Action, Custom Apex Action

### 4. Conflitos de Ordem de Execução
- Múltiplos Record-Triggered Flows no mesmo objeto (BeforeSave/AfterSave)
- Flow + Trigger + Process Builder + Workflow no mesmo objeto
- Field Updates em Flow disparando re-evaluation de validações
- Prioridade: Trigger (before) → Flow BeforeSave → Validation → Flow AfterSave → Trigger (after) → Flow AfterSave (async) → PB/WF

### 5. Variáveis de Contexto
- `$Record` / `$Record__Prior` (BeforeSave vs AfterSave)
- `$Flow` (interview context)
- `$API` (session info)
- `$Permission.Custom_Perm` (custom permissions)

## Interface de Uso (para @sf-surveyor e @sf-deep-diver)

### Entrada
```json
{
  "scope": "force-app/main/default/flows/OnboardingPJ_RecordTriggered.flow-meta.xml",
  "analysis_type": "full", // "full" | "decision_logic" | "data_operations" | "execution_order"
  "context": "Account"
}
```

### Saída Esperada
```json
{
  "flow_name": "OnboardingPJ_RecordTriggered",
  "status": "Active",
  "process_type": "RecordTriggeredFlow",
  "trigger_type": "AfterSave",
  "object": "Account",
  "nodes_summary": {
    "decisions": 3,
    "assignments": 5,
    "loops": 1,
    "data_elements": {
      "get_records": 2,
      "create_records": 1,
      "update_records": 1,
      "delete_records": 0
    },
    "subflows": 1,
    "actions": 2
  },
  "business_rules": [
    {
      "node": "Decision_Check_CNPJ",
      "condition": "NOT(ISBLANK({!$Record.CNPJ__c})) AND REGEX({!$Record.CNPJ__c}, '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$')",
      "outcome_true": "Validação OK",
      "outcome_false": "Erro CNPJ Inválido"
    }
  ],
  "data_operations": [
    {
      "element": "Get_Propostas_Relacionadas",
      "type": "GET_RECORDS",
      "object": "Proposta_Credito__c",
      "filter": "Account__c = {!$Record.Id} AND Status__c = 'Em_Analise'",
      "store_as": "Collection"
    },
    {
      "element": "Loop_Propostas",
      "type": "LOOP",
      "collection": "{!Get_Propostas_Relacionadas}",
      "iterator": "propostaAtual",
      "inner_elements": ["Assignment_Atualizar_Status", "Update_Proposta"]
    }
  ],
  "execution_order_conflicts": [
    "AccountTrigger (after update) também atualiza Proposta_Credito__c - risco de race condition"
  ],
  "invocable_methods_called": [
    "SerasaIntegration.consultarSerasa (via Action)"
  ]
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-surveyor` para classificação de flows ativos/obsoletos e tipos
- Acionada por `@sf-deep-diver` para extração de regras de decisão e mutações de estado
- Resultados alimentam `@sf-auditor` para verificação de 100% dos flows no escopo