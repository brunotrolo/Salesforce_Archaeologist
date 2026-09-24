---
name: integration-contract-builder
description: Playbook de análise Salesforce para extração e validação de contratos de integração: Named Credentials, External Credentials, HttpRequest/HttpResponse, payloads JSON/XML, schemas de request/response, error handling, retry logic. Use SEMPRE que precisar documentar callouts com precisão cirúrgica.
---

# Playbook de Análise: Integration Contract Builder

## Missão
Extrair contratos de integração literais do código Apex (zero inferência): endpoints, métodos HTTP, headers, payloads request/response, tratamento de erro, retry, timeouts.

## Capacidades Principais

### 1. Named Credentials & External Credentials
- **Named Credential**: Endpoint base, auth protocol, principal type, certificates
- **External Credential**: Principal (Named Principal / Per User), parameters, OAuth scopes
- **Remote Site Settings**: CSP Trusted Sites para callouts legacy
- **Legacy**: `HttpRequest.setEndpoint('https://...')` sem Named Credential (flag de risco)

### 2. HttpRequest - Extração Literal
```apex
HttpRequest req = new HttpRequest();
req.setEndpoint('callout:Serasa_API/v1/consulta');  // Named Credential + path
req.setMethod('POST');                              // GET, POST, PUT, PATCH, DELETE, HEAD
req.setTimeout(60000);                              // milliseconds (max 120000)
req.setHeader('Content-Type', 'application/json');  // Headers literais
req.setHeader('Authorization', 'Bearer ' + token);  // Auth headers
req.setBody(JSON.serialize(payload));               // Payload serializado
req.setClientCertificateName('Cert_Name');          // mTLS se aplicável
```

### 3. HttpResponse - Parsing & Error Handling
```apex
HttpResponse res = new Http().send(req);
Integer statusCode = res.getStatusCode();           // 200, 201, 400, 401, 404, 500, 503
String responseBody = res.getBody();                // Body bruto
Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
// Ou tipado:
SerasaResponse typed = (SerasaResponse) JSON.deserialize(responseBody, SerasaResponse.class);
```

### 4. Payload Structures (Request/Response)
- **Request**: Extrair estrutura do objeto serializado (inner class ou Map)
- **Response**: Extrair classe de deserialização (inner class) ou `deserializeUntyped` paths
- **Campos obrigatórios vs opcionais**: Baseado em validações no código
- **Enums/Picklists**: Valores literais usados no código

### 5. Error Handling & Retry Patterns
- **Try/Catch**: `CalloutException`, `System.CalloutException`
- **Status Code Checks**: `if (res.getStatusCode() >= 400)`
- **Retry Logic**:
  - `@future` re-chamada com backoff
  - `Queueable` com `Database.executeQueueable` e contador de tentativas
  - `Schedulable` para retry agendado
- **Circuit Breaker**: Custom setting/Custom Metadata com threshold de falhas
- **Fallback**: Valores default, cache local, degraded mode

### 6. Callout Limits & Governance
- Limite: 100 callouts/transação (síncrono), 100 (assíncrono)
- Timeout máximo: 120s (padrão 10s)
- Long-running callouts: `Continuation` (Visualforce) / Async Apex
- `Limits.getCallouts()` / `Limits.getLimitCallouts()` para monitoramento

### 7. External Services (Declarativo)
- Schema OpenAPI/Swagger importado
- Gera Apex classes tipadas automaticamente
- Invocado via Flow Action ou Apex
- Named Credential para auth

## Interface de Uso (para @sf-deep-diver)

### Entrada
```json
{
  "scope": "force-app/main/default/classes/SerasaIntegration.cls",
  "analysis_type": "full", // "full" | "contracts" | "error_handling" | "retry_logic"
  "context": "jornada-onboarding-pj"
}
```

### Saída Esperada
```json
{
  "contracts": [
    {
      "name": "Consulta Serasa PJ",
      "class": "SerasaIntegration",
      "method": "consultarSerasa",
      "named_credential": "Serasa_API",
      "endpoint_path": "/v1/consulta",
      "full_endpoint": "https://api.serasa.com.br/v1/consulta",
      "method": "POST",
      "timeout_ms": 60000,
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Correlation-Id": "UUID.randomUUID()"
      },
      "request_schema": {
        "type": "object",
        "properties": {
          "cnpj": { "type": "string", "pattern": "^\\d{14}$" },
          "tipo": { "type": "string", "enum": ["PF", "PJ"] },
          "produto": { "type": "string", "default": "score_pj" }
        },
        "required": ["cnpj", "tipo"]
      },
      "request_example": "{ \"cnpj\": \"12345678000199\", \"tipo\": \"PJ\", \"produto\": \"score_pj\" }",
      "response_schema": {
        "type": "object",
        "properties": {
          "score": { "type": "integer", "minimum": 0, "maximum": 1000 },
          "faixa_score": { "type": "string", "enum": ["A", "B", "C", "D", "E"] },
          "restricoes": {
            "type": "array",
            "items": { "type": "object", "properties": { "tipo": "string", "valor": "number", "data": "string" } }
          },
          "consultado_em": { "type": "string", "format": "date-time" }
        }
      },
      "response_example": "{ \"score\": 720, \"faixa_score\": \"B\", \"restricoes\": [], \"consultado_em\": \"2026-09-18T14:30:00Z\" }",
      "error_handling": {
        "try_catch": true,
        "status_code_checks": [400, 401, 404, 429, 500, 503],
        "retry": {
          "type": "QUEUEABLE",
          "class": "SerasaRetryJob",
          "max_attempts": 3,
          "backoff_ms": 5000,
          "backoff_multiplier": 2
        },
        "circuit_breaker": {
          "enabled": true,
          "threshold": 5,
          "window_minutes": 10,
          "custom_setting": "Serasa_Circuit_Breaker__c"
        },
        "fallback": "Retorna score cached se disponível, senão erro amigável"
      },
      "governor_impact": {
        "callouts_per_txn": 1,
        "estimated_cpu_ms": 150,
        "heap_impact_kb": 50
      }
    }
  ],
  "summary": {
    "total_callouts": 3,
    "unique_named_credentials": 2,
    "retry_implementations": 2,
    "circuit_breakers": 1,
    "legacy_endpoints_without_nc": 0
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-deep-diver` no Nível 4 (Outbound Integrations) - **obrigatória**
- Fornece contratos para `@sf-architect` gerar Sequence Diagrams com payloads reais
- Alimenta `@sf-auditor` para contagem exata de callouts vs documentados
- Detecta endpoints hardcoded (sem Named Credential) → flag Well-Architected Trusted