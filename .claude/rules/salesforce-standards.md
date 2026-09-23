# Salesforce Standards & Artifact Taxonomy (Reference Knowledge)

Esta é a base de conhecimento oficial para taxonomia de metadados, limites de governador, padrões arquiteturais e comportamentos de runtime Salesforce. Todos os subagentes do Salesforce Archaeologist devem consultar este documento como fonte de verdade.

---

## 1. Taxonomia de Metadados (Source Format - SFDX)

### Estrutura de Diretórios Padrão
```
force-app/main/default/
├── apex-classes/           # .cls + .cls-meta.xml
├── triggers/               # .trigger + .trigger-meta.xml
├── flows/                  # .flow-meta.xml (FlowDefinitionView)
├── objects/                # Custom/Standard Objects
│   ├── <ObjectName>/
│   │   ├── fields/         # .field-meta.xml
│   │   ├── validationRules/ # .validationRule-meta.xml
│   │   ├── recordTypes/    # .recordType-meta.xml
│   │   ├── listViews/      # .listView-meta.xml
│   │   ├── compactLayouts/ # .compactLayout-meta.xml
│   │   └── <ObjectName>.object-meta.xml
├── lwc/                    # Lightning Web Components
│   └── <componentName>/
│       ├── <componentName>.js
│       ├── <componentName>.html
│       ├── <componentName>.css
│       └── <componentName>.js-meta.xml
├── aura/                   # Aura Components
│   └── <componentName>/
│       ├── <componentName>.cmp
│       ├── <componentName>Controller.js
│       ├── <componentName>Helper.js
│       └── <componentName>.design
├── namedCredentials/       # .namedCredential-meta.xml
├── externalCredentials/    # .externalCredential-meta.xml
├── remoteSiteSettings/     # .remoteSite-meta.xml
├── cspTrustedSites/        # .cspTrustedSite-meta.xml
├── permissionSets/         # .permSet-meta.xml
├── profiles/               # .profile-meta.xml
├── customMetadata/         # .md-meta.xml
├── customSettings/         # .settings-meta.xml
├── labels/                 # CustomLabels.labels-meta.xml
├── email/                  # EmailTemplates
├── reports/                # Report folders
├── dashboards/             # Dashboard folders
└── staticresources/        # .resource-meta.xml
```

### Tipos de Flow (FlowDefinitionView.processType)
| Valor | Tipo | Descrição |
|-------|------|-----------|
| `AutolaunchedFlow` | Autolaunched | Chamado via Apex/REST/Subflow |
| `Flow` | Screen Flow | Interface de usuário guiada |
| `RecordTriggeredFlow` | Record-Triggered | Disparado por DML em objeto |
| `ScheduledFlow` | Scheduled | Execução agendada (cron) |
| `ContactRequestFlow` | Contact Request | Omni-Channel |
| `UserProvisioningFlow` | User Provisioning | Provisionamento de usuários |

**Record-Triggered Flow - triggerType**:
- `BeforeSave` (Fast Field Updates) - antes do commit, sem DML adicional
- `AfterSave` - após commit, pode fazer DML, callouts, emails

### Named Credential - Authentication Protocols
- `NoAuthentication` - Sem auth
- `Password` - Username/Password
- `OAuth2` - OAuth 2.0 (Authorization Code, Client Credentials, JWT Bearer)
- `AwsSigV4` - AWS Signature v4
- `Jwt` - JWT Bearer Token
- `Custom` - Custom auth via Apex plugin

---

## 2. Governor Limits (Hard Limits - Não Negociáveis)

### Limites por Transação Síncrona
| Recurso | Limite | Contexto |
|---------|--------|----------|
| SOQL Queries | 100 | Por transação |
| DML Statements | 150 | Por transação |
| DML Rows | 10.000 | Por transação |
| SOSL Queries | 20 | Por transação |
| Callouts (HTTP) | 100 | Por transação |
| Callout Timeout | 120s | Máximo por callout |
| CPU Time | 10.000ms | Síncrono |
| CPU Time | 60.000ms | Assíncrono (@future, Queueable, Batch) |
| Heap Size | 6MB | Síncrono |
| Heap Size | 12MB | Assíncrono |
| Stack Depth | 1.000 | Chamadas recursivas |
| Email Invocations | 10 | Por transação |
| Push Notifications | 10 | Por transação |

### Limites por Transação Assíncrona (@future, Queueable, Batch execute)
| Recurso | Limite |
|---------|--------|
| SOQL Queries | 200 |
| DML Statements | 150 |
| DML Rows | 10.000 |
| Callouts | 100 |
| CPU Time | 60.000ms |
| Heap Size | 12MB |

### Batch Apex (Database.Batchable)
| Recurso | Limite |
|---------|--------|
| Batch Size (scope) | 2.000 (máx), 200 (padrão) |
| Batches em execução | 5 simultâneos |
| Batches agendados | 100 em 24h |
| Total de registros | 50 milhões por job |
| start() SOQL | 50 milhões de registros |

---

## 3. Padrões Arquiteturais Oficiais

### Apex Enterprise Patterns (fflib) - Camadas
```
┌─────────────────────────────────────┐
│         Application Layer           │  (Factory, UnitOfWork, SelectorFactory)
├─────────────────────────────────────┤
│           Service Layer             │  (Business Logic, Transactions, UoW)
├─────────────────────────────────────┤
│           Domain Layer              │  (Trigger Handlers, Object Behaviors)
├─────────────────────────────────────┤
│           Selector Layer            │  (Query Encapsulation, Composability)
├─────────────────────────────────────┤
│            Data Layer               │  (SObjects, Database)
└─────────────────────────────────────┘
```

**Princípios**:
- **Selector**: `selectById`, `selectByRelationship`, `newQueryFactory()` - NUNCA SOQL inline em Service/Domain
- **Domain**: `onBeforeInsert`, `onAfterUpdate`, `onValidate` - Toda lógica de trigger AQUI
- **Service**: `createRecords`, `updateRecords`, `processBusinessLogic` - Orquestração, UnitOfWork
- **UnitOfWork**: `registerNew`, `registerDirty`, `registerDeleted`, `commitWork()` - Batching DML

### Trigger Handler Pattern (Obrigatório)
```apex
// Trigger (mínimo possível)
trigger AccountTrigger on Account (
    before insert, after insert,
    before update, after update,
    before delete, after delete
) {
    AccountTriggerHandler.run(Trigger.isExecuting, Trigger.isInsert, ...);
}

// Handler (fflib Domain ou padrão próprio)
public class AccountTriggerHandler {
    public static void run(Boolean isExecuting, Boolean isInsert, ...) {
        if (Trigger.isBefore && Trigger.isInsert) {
            AccountDomain.onBeforeInsert(Trigger.new);
        }
        // ... outros eventos
    }
}
```

---

## 4. Ordem de Execução (Execution Order) - Crítico para Conflitos

1. **System Validation** (Required fields, formats, max length)
2. **Before Record-Triggered Flows** (Fast Field Updates)
3. **Before Triggers** (Apex)
4. **Custom Validation Rules**
5. **Duplicate Rules** (Block/Allow)
6. **After Record-Triggered Flows** (After Save)
7. **After Triggers** (Apex)
8. **Assignment Rules**
9. **Auto-Response Rules**
10. **Workflow Rules** (Field Updates → re-run validation)
11. **Process Builder** (Field Updates → re-run validation)
12. **Escalation Rules**
13. **Entitlement Rules**
14. **Commit** (Database commit)
15. **Post-Commit**:
    - After Commit Flows (Async)
    - @future methods
    - Queueable jobs
    - Batch Apex
    - Platform Events (Publish After Commit)
    - Outbound Messages
    - Email sending

**⚠️ Conflito Crítico**: Workflow + Process Builder + Record-Triggered Flow no mesmo objeto = ordem não determinística para field updates. **Migração obrigatória para Flow único.**

---

## 5. LWC - Decorators & Lifecycle

### Decorators Principais
| Decorator | Uso | Reativo? |
|-----------|-----|----------|
| `@api` | Propriedade pública (pai → filho) | Sim |
| `@track` | Propriedade privada reativa (objetos/arrays) | Sim |
| `@wire` | Wire adapter (getRecord, getObjectInfo, Apex) | Sim (readonly) |
| `@wire(apexMethod)` | Imperativo via wire | Sim |

### Wire Adapters Comuns
```javascript
// Record data
@wire(getRecord, { recordId: '$recordId', fields: ['Account.Name', 'Account.CNPJ__c'] })
account;

// Object metadata
@wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
objectInfo;

// Picklist values
@wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: STATUS_FIELD })
statusValues;

// Apex method (cacheable=true)
@wire(searchAccounts, { searchTerm: '$searchTerm' })
accounts;
```

### Imperative Apex Call
```javascript
import { createProposta } from '@salesforce/apex/PropostaController.createProposta';

createProposta({ propostaData })
  .then(result => { /* success */ })
  .catch(error => { /* handle error */ });
```

### Lifecycle Hooks
- `constructor()` - Inicialização
- `connectedCallback()` - Inserido no DOM (carregar dados)
- `renderedCallback()` - Após render (evitar loops)
- `disconnectedCallback()` - Removido do DOM (cleanup)
- `errorCallback(error, stack)` - Error boundary

---

## 6. Flow - Nós Críticos para Engenharia Reversa

### Elementos de Dados (Data Elements)
| Elemento | Operação | Bulk? |
|----------|----------|-------|
| Create Records | INSERT | Sim (coleção) |
| Update Records | UPDATE | Sim (coleção) |
| Delete Records | DELETE | Sim (coleção) |
| Get Records | SELECT (SOQL) | Sim (filtros) |
| Fast Field Updates | UPDATE (Before Save) | Sim |

### Elementos de Lógica
- **Decision**: Fork condicional (outcomes com condições)
- **Assignment**: Atribuição de variáveis
- **Loop**: Iteração sobre coleção (collection variable)
- **Subflow**: Chamada a outro Flow (Autolaunched)
- **Action**: @InvocableMethod, Email, Quick Action, etc.

### Variáveis de Contexto ($Record, $Record__Prior)
- `$Record`: Valores atuais (After Save) ou novos (Before Save)
- `$Record__Prior`: Valores antes da transação (apenas After Save/Update)

---

## 7. Security & Sharing Model

### Apex Sharing Keywords
| Keyword | Comportamento |
|---------|---------------|
| `with sharing` | Enforces sharing rules do usuário corrente |
| `without sharing` | Ignora sharing (System Mode) |
| `inherited sharing` | Herda do chamador (padrão para @AuraEnabled) |

### CRUD/FLS Enforcement (Obrigatório em @AuraEnabled/@RestResource)
```apex
// Antes de DML/Query
if (!Schema.sObjectType.Account.isCreateable()) {
    throw new AuraHandledException('Sem permissão Create em Account');
}
// Fields
List<String> accessibleFields = Security.stripInaccessible(
    AccessType.CREATEABLE,
    new List<Account>{ newAccount }
).getRecords()[0].getPopulatedFieldsAsMap().keySet();
```

### Custom Permissions
- Definidas em Setup → Custom Permissions
- Referenciadas: `$Permission.Nome_Permissao` (Validation Rules, Flows)
- Apex: `FeatureManagement.checkPermission('Namespace.Permission')`

---

## 8. Anti-Patterns Comuns (Detecção Obrigatória)

| Anti-Pattern | Detecção | Risco |
|--------------|----------|-------|
| SOQL em Loop | `for (...) { SELECT ... }` | Limite 100 queries |
| DML em Loop | `for (...) { insert ... }` | Limite 150 DML |
| Hardcoded IDs | `'001...'`, `'00D...'` | Não deployável entre orgs |
| Trigger Spaghetti | Lógica no .trigger, sem handler | Manutenibilidade zero |
| Testes sem Assert | `@isTest` sem `System.assert` | Cobertura falsa |
| Query sem WHERE | `SELECT Id FROM Account` | Table scan, performance |
| Campo Fórmula Complexa | > 5.000 chars / 10 níveis | Performance, limites |
| Recursion não controlada | Trigger chama update no mesmo obj | Loop infinito, stack overflow |

---

## 9. Well-Architected Framework (Salesforce Official)

### Pilar 1: Trusted (Confiável)
- **Segurança**: CRUD/FLS, Sharing, Encryption, Named Credentials
- **Governança**: Change Management, Version Control, Code Review
- **Conformidade**: GDPR, LGPD, SOX, PCI-DSS
- **Resiliência**: Error Handling, Retry, Circuit Breaker, Monitoring

### Pilar 2: Easy (Simples)
- **Clareza**: Naming conventions, Documentation, Modularização
- **Manutenibilidade**: Low Coupling, High Cohesion, SOLID
- **Observabilidade**: Debug Logs, Event Monitoring, Custom Metrics
- **Developer Experience**: DX, Scratch Orgs, CI/CD

### Pilar 3: Adaptable (Adaptável)
- **Escalabilidade**: Bulkification, Async Patterns, Partitioning
- **Extensibilidade**: Platform Events, Custom Metadata, Feature Flags
- **Integração**: API-Led, External Services, MuleSoft
- **Inovação**: Einstein, Flow, Low-Code, DevOps

---

## 10. API Versions & Compatibility

### Versões Críticas
| Versão | Mudança Relevante |
|--------|-------------------|
| 58.0 (Spring '24) | Flow Trigger Order enforcement |
| 57.0 (Winter '24) | Lightning Web Security (LWS) |
| 56.0 (Summer '23) | API version default para novos metadados |
| 55.0 (Spring '23) | Enhanced Domain Suffix enforcement |
| 54.0 (Winter '23) | Flow Builder performance improvements |

**Regra**: Sempre usar API version do arquivo `.xml-meta.xml` para interpretar comportamento. Não assumir versão mais recente.

---

## 11. Ferramentas Oficiais de Análise (Referência)

### Salesforce Code Analyzer (PMD + Graph Engine)
- **Regras PMD**: Apex Best Practices, Performance, Security, Error Prone
- **Graph Engine**: Data-flow analysis, Control-flow graphs, Call graphs
- **Comando**: `sf code-analyzer run --target-dir force-app --format sarif`

### Salesforce CLI - Metadata Commands
```bash
# Listar todos metadados
sf project deploy preview --source-dir force-app/main/default

# Descrever objeto
sf sobject describe --sobject Account --json

# Listar flows ativos
sf data query --query "SELECT Id, MasterLabel, Status, ProcessType FROM FlowDefinitionView WHERE Status='Active'" --json

# Apex test run
sf apex run test --class-names MinhaTestClass --code-coverage --json
```

---

## 12. Convenções de Naming (Para Consistência no MAP)

### Apex
- Classes: `PascalCase` + Sufixo semântico (`Service`, `Domain`, `Selector`, `Controller`, `Handler`, `Test`)
- Métodos: `camelCase` + verbo (`get`, `create`, `calculate`, `validate`, `process`)
- Variáveis: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`

### Metadados XML
- Custom Objects: `PascalCase__c` (ex: `Proposta_Credito__c`)
- Fields: `PascalCase__c` (ex: `Score_Serasa__c`)
- Flows: `PascalCase` + Tipo (ex: `OnboardingPJ_RecordTriggered`)
- Permission Sets: `PascalCase` + Funcão (ex: `OnboardingPJ_Manager`)
- Named Credentials: `PascalCase` + Sistema (ex: `Serasa_API`)

### LWC
- Pasta/Arquivos: `camelCase` (ex: `propostaWizard`)
- Propriedades @api: `camelCase`
- Eventos customizados: `lowercase` com prefixo (ex: `propostacreated`)

---

## 13. Source Linkage Format (Padrão Obrigatório)

Todo artefato documentado DEVE usar:
```
Source: force-app/main/default/<path>/<file.ext>:<start_line>-<end_line>
Context: <class_name>.<method_name> | <flow_name>.<node_name> | <object>.<validation_rule>
Evidence: "<trecho literal de até 200 chars>"
```

Exemplo:
```
Source: force-app/main/default/classes/SerasaIntegration.cls:34-67
Context: SerasaIntegration.consultarSerasa
Evidence: "HttpRequest req = new HttpRequest(); req.setEndpoint('callout:Serasa_API/v1/consulta'); req.setMethod('POST'); req.setBody(JSON.serialize(payload));"
```

---
 
## 15. Padrões de Integração Metadata-Driven (Config-Driven) - CRÍTICO
 
### IntegrationConfig__mdt Pattern (Padrão Enterprise Comum)
Custom Metadata Type usado como fonte de verdade única para configuração de endpoints:
 
**Campos Padrão:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `CredentialName__c` | String | Named Credential API Name |
| `EndPoint__c` | String | Path do endpoint (pode ter placeholders `{0}`, `{1}`) |
| `Method__c` | String | GET, POST, PUT, DELETE, PATCH |
| `Timeout__c` | Number | Timeout em milissegundos |
| `ClientId__c` | String | OAuth Client ID |
| `ClientSecret__c` | String | OAuth Client Secret (sensível) |
| `TokenType__c` | String | Referência a outro registro de config para token (ex: `TokenGatewayAuth`) |
| `TokenDocument__c` | String | Documento de referência do token |
| `TokenRedirectUri__c` | String | OAuth Redirect URI |
| `TokenScope__c` | String | OAuth Scopes |
| `ClientCredencialScope__c` | String | Client Credentials Scope |
| `Authorization__c` | String | Authorization header customizado |
| `ClientCredencialScope__c` | String | Scope para Client Credentials |
| `GrantType__c` | String | OAuth Grant Type |
| `Campaign__c` | Lookup | Campanha associada (raro) |
 
**Uso Genérico em Runtime:**
```apex
IntegrationConfig__mdt config = [
    SELECT CredentialName__c, EndPoint__c, Method__c, Timeout__c,
           ClientId__c, ClientSecret__c, TokenType__c, TokenDocument__c,
           TokenRedirectUri__c, TokenScope__c, ClientCredencialScope__c,
           Authorization__c, ClientCredencialScope__c, GrantType__c
    FROM IntegrationConfig__mdt
    WHERE DeveloperName = :serviceName
];
 
String endpoint = 'callout:' + config.CredentialName__c + config.EndPoint__c;
req.setEndpoint(endpoint);
req.setMethod(config.Method__c);
req.setTimeout(Integer.valueOf(config.Timeout__c));
```
 
### Token Management Pattern (Cadeia de Tokens)
 
**Cadeia Típica:**
```
TokenAuth (Client Credentials) 
  → access_token 
    → Header: Authorization: Bearer {token}
      → Consumido por N+ serviços downstream

TokenService1 (Client Credentials)
  → access_token
    → Header: Authorization: Bearer {token}
      → Consumido por N+ serviços downstream

TokenService2 (OAuth2 / JWT)
  → access_token
    → Header: Authorization: Bearer {token}
      → Consumido por N+ serviços downstream
```
 
**TokenType__c Chain:**
- `IntegrationConfig.TokenAuth` → `TokenType__c = 'TokenAuth'`
- `IntegrationConfig.TokenService1` → `TokenType__c = 'TokenService1'`
- `IntegrationConfig.TokenService2` → `TokenType__c = 'TokenService2'`
 
**TokenManager Genérico:**
```apex
String token = TokenManager.getToken(config.TokenType__c);
req.setHeader('Authorization', 'Bearer ' + token);
```
 
### Template Method: AbstractAPIConnector Pattern
Classes base comuns em orgs enterprise:
- `AbstractAPIConnector` (base template)
- `*_API` (ex: `*_API`, `*_V2_API`, `*_API_V1`)
- `*_CrossAuthenticatedCallService`, `*_AuthenticatedCallService`
- `*_TokenManager`

**Estrutura Típica:**
```apex
public abstract class AbstractAPIConnector {
    protected IntegrationConfig__mdt config;
    protected String accessToken;
    
    public AbstractAPIConnector(String serviceName) {
        this.config = [SELECT ... FROM IntegrationConfig__mdt WHERE DeveloperName = :serviceName];
    }
    
    protected String getToken() {
        if (String.isBlank(this.config.TokenType__c)) return null;
        return TokenManager.getToken(this.config.TokenType__c);
    }
    
    protected void addAuthHeader(HttpRequest req) {
        String token = getToken();
        if (token != null) {
            req.setHeader('Authorization', 'Bearer ' + token);
        }
    }
    
    protected HttpResponse send(HttpRequest req) {
        addAuthHeader(req);
        // Circuit Breaker, Retry, Logging
        return Http.send(req);
    }
}
```
 
### External Services em Flows
Flows podem chamar External Services via `Action` elements:
- `actionType: ExternalService`
- Input/Output parameter mappings automáticos
- Baseado em OpenAPI/Swagger schema importado
- Invocado via `Flow.Interview` ou `Action` element
 
### Payload Chaining Patterns (Encadeamento de Payloads)

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Token Flow** | access_token de auth → Header Authorization downstream | SRV_01.token → SRV_02..N Header |
| **Response → Request** | Campo do response alimenta request downstream | extrato.saldoDevedor → simulacao.valorTotal |
| **Bidirectional Sync** | Sincronização entre sistemas | limiteDisponivel ↔ limiteDisponivel |
| **Compensação** | Rollback se downstream falha | transferência falha → rollback local |
| **Event Publishing** | Platform Event com dados do response | PaymentProcessed__e com comprovante |

**Exemplos Genéricos:**
| Origem (Output) | Destino (Input) | Transformação | Fonte |
|-----------------|-----------------|---------------|-------|
| SRV_04: `extrato.movimentos[].valor` | SRV_05: `boleto.valor` | Soma parcelas vencidas | <OrquestradorService> |
| SRV_04: `extrato.saldoDevedor` | SRV_06: `simulacao.valorTotal` | Base cálculo antecipação | <RegrasLanceService> |
| SRV_08: `limite.limiteDisponivel` | SRV_11: `limiteConta.limiteDisponivel` | Sincronização bidirecional | <UpdateLimitService> |
| SRV_09: `fatura.valorTotal` | SRV_13: `extrato.lancamentos[].valor` | Reconciliação fatura vs extrato | <InvoiceHandler> |
| SRV_14: `transferencia.comprovante` | SRV_15: `sync.dados.comprovante` | Auditoria cross-domain | <SyncService> |
| SRV_02: `cartao.limiteDisponivel` | SRV_03: `bloqueio.valor` | Valida limite p/ bloqueio | <CardBlockService> |
 
### Platform Events para Integração Assíncrona
Eventos publicados pós-commit para desacoplamento:
- `<EventName>__e` (<Publisher> → <Consumer>)
- `<EventName>__e` (<Publisher> → <Consumer>)
- `<EventName>__e` (<Publisher> → <Consumer>)
- `<EventName>__e` (<Publisher> → <Consumer>)
 
### Integração LWC → Apex → Integration Chain
```
LWC (import @salesforce/apex/Controller.method)
    ↓
Controller (@AuraEnabled)
    ↓
Service (<ServiceName1>, <ServiceName2>, etc.)
    ↓
Integration Gateway (<Gateway1_API>, <Gateway2_API>, etc.)
    ↓
AbstractAPIConnector (executa HttpRequest)
    ↓
Named Credential + External Credential
    ↓
External System
```

### LWC → Apex → Callout Mapping
- **Total LWCs**: N
- **LWCs chamando Apex controllers com callouts**: N
- **Apex Controllers @AuraEnabled com callouts**: N
- **Pattern**: LWC → @AuraEnabled Controller → Service → Integration Gateway → Named Credential → External System

---
 
## 16. Custom Metadata Types - Taxonomia Expandida

### IntegrationConfig__mdt (N records)
Campos críticos para engenharia reversa:
- `CredentialName__c` → Named Credential API Name
- `EndPoint__c` → Path com placeholders `{0}`, `{1}`
- `Method__c` → GET, POST, PUT, DELETE, PATCH
- `Timeout__c` → Timeout em ms (default 120000)
- `ClientId__c`, `ClientSecret__c` → OAuth Credentials
- `TokenType__c` → Referência a outro IntegrationConfig para token
- `TokenDocument__c`, `TokenRedirectUri__c`, `TokenScope__c` → OAuth params
- `ClientCredencialScope__c`, `Authorization__c` → Auth customizado
 
### Distribuição por Named Credential
| Named Credential | Endpoints | % |
|------------------|-----------|---|
| <Credential1> | N | XX% |
| <Credential2> | N | XX% |
| <Credential3> | N | XX% |
| <Credential4> | N | XX% |
| <Credential5> | N | XX% |
| Outras (N) | N | XX% |
 
### Domínios de Serviço (Service Domains)
| Domínio | Endpoints |
|---------|-----------|
| <Domain1> | N |
| <Domain2> | N |
| <Domain3> | N |
| <Domain4> | N |
| <Domain5> | N |
| <Domain6> | N |
| <Domain7> | N |
| <Domain8> | N |
| <Domain9> | N |
| <Domain10> | N |
| <Domain11> | N |
| <Domain12> | N |
| <Domain13> | N |
| <Domain15> | N |
| <Domain16> | N |
| <Domain17> | N |
| <Domain18> | N |
| ... | ... |
 
---
 
## 17. LWC → Apex → Integration Chain - Mapeamento Completo
 
### Métricas
- **Total LWCs**: N
- **LWCs chamando Apex controllers com callouts**: N
- **Apex Controllers @AuraEnabled com callouts**: N
- **Pattern**: LWC → @AuraEnabled Controller → Service → Integration Gateway → Named Credential → External System
 
### Principais Controllers @AuraEnabled com Callouts
| Controller | Métodos @AuraEnabled | Named Credentials Usadas |
|------------|----------------------|---------------------------|
| <Controller1> | <method1>, <method2> | <NC1>, <NC2> |
| <Controller2> | <method1>, <method2> | <NC1>, <NC2> |
| <Controller3> | <method1>, <method2> | <NC1>, <NC2> |
 
---

## 18. Checklist de Validação Expandida (Para @sf-auditor)

### Por Custom Metadata IntegrationConfig__mdt
- [ ] Total records = contagem real (N)
- [ ] 100% têm CredentialName__c, EndPoint__c, Method__c
- [ ] CredentialName__c existe como Named Credential
- [ ] TokenType__c (se preenchido) referencia IntegrationConfig válido
- [ ] Agrupamento por CredentialName__c completo

### Por Named Credential
- [ ] Total NC = contagem real (N)
- [ ] Total External Credentials = N
- [ ] Cada NC OAuth2 tem ExternalCredential correspondente
- [ ] Nenhum endpoint hardcoded sem Named Credential

### Por LWC → Apex → Callout
- [ ] Total LWCs = contagem real (N)
- [ ] LWCs chamando Apex = N
- [ ] Controllers @AuraEnabled chamados = N
- [ ] Cadeia LWC → Controller → Service → Integration mapeada 100%

### Por Token Chain
- [ ] Token Flow mapeado: Source → N downstream
- [ ] Business Data Chaining: N encadeamentos Response→Request
- [ ] TokenType__c chain válida

### Por Payload Chaining
- [ ] Token Flow: N downstream services
- [ ] Business Chaining: N encadeamentos Response→Request

### Por Custom Metadata IntegrationConfig
- [ ] Total records = N
- [ ] 100% têm CredentialName__c, EndPoint__c, Method__c
- [ ] CredentialName__c existe como Named Credential
- [ ] TokenType__c válido

### Validação Well-Architected Expandida
- [ ] Idempotency Keys: % endpoints mutantes (target > 80%)
- [ ] Circuit Breakers: % serviços (target > 80%)
- [ ] Retry Policies: 100% serviços
- [ ] Token Refresh: 100% automático
- [ ] Remote Site Settings Legacy: 0 (target)

*Este documento é a fonte de verdade para todos os subagentes do Salesforce Archaeologist. Atualize conforme novas versões da plataforma.*