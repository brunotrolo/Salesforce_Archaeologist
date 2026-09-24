---
name: c4-modeler
description: "Playbook de análise Salesforce para modelagem C4 (Context, Containers, Components, Code) aplicada a Salesforce: mapeamento de orgs como sistemas, containers (managed packages, external systems), components (Apex, Flow, LWC), código. Validação de conformidade com notação Simon Brown. Use SEMPRE na Fase 4 para arquitetura de referência."
---

# Playbook de Análise: C4 Modeler

## Missão
Traduzir arquitetura Salesforce validada para notação C4 Model (Simon Brown), gerando diagramas de Contexto (C1), Containers (C2), Componentes (C3) e Código (C4) com terminologia Salesforce.

## Capacidades Principais

### 1. Níveis C4 Aplicados a Salesforce

#### C1 - System Context (Contexto de Sistema)
```
┌─────────────────────────────────────────────────────────┐
│                    Salesforce Org                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Users     │  │  External   │  │  External   │     │
│  │  (Internos) │  │   Systems   │  │   Systems   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         ▼                ▼                ▼             │
│  ┌─────────────────────────────────────────────┐       │
│  │         Salesforce Platform (Core)          │       │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │       │
│  │  │  Data   │ │ Logic   │ │  Interface  │   │       │
│  │  │  Cloud  │ │  Cloud  │ │   Cloud     │   │       │
│  │  └─────────┘ └─────────┘ └─────────────┘   │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```
- **Atores**: Usuários internos (Perfis), Usuários externos (Experience Cloud), Sistemas externos (ERP, Gateway Pagamento, Bureau Crédito)
- **Sistema**: A Salesforce Org (ou Multi-Org landscape)

#### C2 - Container Diagram (Diagrama de Containers)
Containers = Unidades deployáveis independentemente:
| Container Salesforce | Tipo | Tecnologia |
|---------------------|------|------------|
| **Core CRM** | Application | Salesforce Platform (Data/Logic/Interface Cloud) |
| **Managed Package X** | Application | Installed Package (namespace) |
| **External System: ERP** | External System | SAP/Oracle/Protheus (REST/SOAP) |
| **External System: Gateway** | External System | Cielo/Stone/Pagar.me (REST) |
| **External System: Bureau** | External System | Serasa/Boa Vista (REST) |
| **Integration Middleware** | Application | MuleSoft / Dell Boomi / Custom Apex |
| **Event Bus** | Queue/Topic | Platform Events / CDC / Change Events |

#### C3 - Component Diagram (Diagrama de Componentes)
Components = Building blocks dentro de um container:
| Component Type | Salesforce Artifact | Exemplo |
|----------------|---------------------|---------|
| **Apex Service** | Apex Class (Service Layer) | `PropostaService`, `CreditAnalysisService` |
| **Apex Domain** | Apex Class (Domain Layer) | `AccountDomain`, `PropostaCreditoDomain` |
| **Apex Selector** | Apex Class (Selector Layer) | `AccountSelector`, `PropostaCreditoSelector` |
| **Apex Controller** | Apex Class (@AuraEnabled) | `PropostaController`, `DocumentoController` |
| **Flow** | Flow (Record-Triggered/Autolaunched) | `OnboardingPJ_RecordTriggered` |
| **LWC** | Lightning Web Component | `propostaWizard`, `documentUploader` |
| **Integration Gateway** | Apex + Named Credential | `SerasaGateway`, `ReceitaFederalGateway` |
| **Platform Event** | Platform Event (`__e`) | `OnboardingCompleted__e` |
| **Custom Object** | SObject | `Proposta_Credito__c`, `Consulta_Serasa__c` |

#### C4 - Code Diagram (Diagrama de Código)
- Classes Apex: métodos, dependências, herança
- Flow nodes: decisions, loops, data elements
- LWC: props, events, wire adapters

### 2. Notação Arcfile para C4
```arcfile
architecture "Target Architecture - Onboarding PJ" {
  context "Salesforce Org - Onboarding PJ" {
    description "Sistema de onboarding pessoa jurídica com arquitetura event-driven"
    
    // C1: System Context
    person "Usuário PJ" as user {
      description "Proponente pessoa jurídica"
    }
    person "Analista Crédito" as analyst {
      description "Back-office para análise manual"
    }
    system_ext "Serasa" as serasa {
      description "Bureau de crédito - Score e restrições"
    }
    system_ext "Receita Federal" as receita {
      description "Validação CNPJ - CNPJ.ws API"
    }
    system_ext "ERP Financeiro" as erp {
      description "SAP/Protheus - Faturamento e contratos"
    }
    
    // C2: Containers
    boundary "Salesforce Org" {
      // Data Cloud
      container "Core CRM" as core {
        technology "Salesforce Platform"
        description "Data Cloud: Account, Proposta_Credito__c, Consulta_Serasa__c"
      }
      container "Managed Package: DocuSign" as docusign {
        technology "Installed Package"
      }
      
      // Logic Cloud
      container "Apex Services" as apex_svc {
        technology "Apex (fflib Service Layer)"
      }
      container "Apex Domain" as apex_dom {
        technology "Apex (fflib Domain Layer)"
      }
      container "Integration Gateway" as int_gw {
        technology "Apex + Named Credentials"
      }
      container "Event Bus" as events {
        technology "Platform Events + CDC"
      }
      
      // Interface Cloud
      container "LWC Experience" as lwc {
        technology "Lightning Web Components"
      }
      container "Experience Cloud" as exp {
        technology "Experience Cloud (Portal PJ)"
      }
    }
  }
  
  flows {
    flow "Happy Path Onboarding" {
      from "user"
      to "lwc"
      to "apex_svc"
      to "apex_dom"
      to "core"
      to "int_gw"
      to "serasa"
      to "int_gw"
      to "apex_svc"
      to "apex_dom"
      to "core"
      to "events"
      to "erp"
    }
    flow "Async Document Processing" {
      from "lwc"
      to "apex_svc"
      to "docusign"
      to "events"
      to "erp"
    }
  }
}
```

### 3. Validação de Conformidade C4
- **Naming**: Containers = `Technology: Name`, Components = `Type: Name`
- **Boundaries**: Claros (Org, Package, External System)
- **Relationships**: Direção, protocolo, descrição
- **Legend**: Cores por layer (Data/Logic/Interface Cloud)

### 4. Target Architecture Patterns (Salesforce)
- **Strangler Fig**: Legacy (WF/PB/Aura) → Modern (Flow/LWC/Apex fflib)
- **Anti-Corruption Layer**: Integration Gateway para sistemas externos
- **Event-Driven**: Platform Events para desacoplamento
- **API-Led**: System/Process/Experience APIs
- **Multi-Org**: Hub-Spoke, Single Source of Truth

## Interface de Uso (para @sf-architect)

### Entrada
```json
{
  "validated_doc": "docs/archaeologist/journeys/onboarding-pj.md",
  "capabilities_map": "docs/archaeologist/CAPABILITIES_MAP.md",
  "target_patterns": ["fflib", "event-driven", "api-led", "strangler-fig"],
  "output_format": "arcfile"
}
```

### Saída Esperada
```json
{
  "c1_context": "arcfile_string_for_C1",
  "c2_containers": "arcfile_string_for_C2",
  "c3_components": "arcfile_string_for_C3",
  "c4_code": "arcfile_string_for_C4",
  "target_architecture": "arcfile_string_for_Target",
  "validation": {
    "c4_compliant": true,
    "warnings": [],
    "missing_elements": []
  },
  "legend": {
    "Data Cloud": "#1f77b4",
    "Logic Cloud": "#ff7f0e",
    "Interface Cloud": "#2ca02c",
    "External Systems": "#d62728",
    "Event Bus": "#9467bd"
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-architect` na Fase 4 - **obrigatória para Target Architecture**
- Consome documentação validada (`VERIFIED_100_PERCENT`)
- Gera C1/C2 para visão executiva (stakeholders)
- Gera C3/C4 para visão técnica (arquitetos, devs)
- Target Architecture → roadmap de migração/refatoração
- Integra com `arcfile-generator` para exportação visual