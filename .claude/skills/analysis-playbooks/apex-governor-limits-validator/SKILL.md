---
name: apex-governor-limits-validator
description: Playbook de análise Salesforce para análise quantitativa de limites de governador: contagem exata de SOQL, DML, CPU, Heap, Callouts por caminho de execução. Simulação de cenários bulk. Use SEMPRE que precisar validar se código escala para volumes de produção.
tools:
  - read_file
  - search_files
  - run_command
---

# Salesforce Official Skill: Apex Governor Limits Validator

## Missão
Fornecer análise quantitativa determinística de consumo de governor limits por transação, identificando riscos de estouro em cenários de volume (bulk).

## Capacidades Principais

### 1. Contagem Estática (Static Analysis)
Via AST parsing e data-flow analysis:
- **SOQL Queries**: Contagem por caminho de execução (incluindo loops, branches)
- **DML Statements**: Insert/Update/Upsert/Delete/Delete por caminho
- **DML Rows**: Estimativa baseada em tamanhos de coleção
- **Callouts**: HttpRequest instanciados por caminho
- **SOSL Queries**: Contagem
- **Email Invocations**: Messaging.sendEmail

### 2. Análise de Cenários Bulk
Simula execução com:
- **Single Record**: 1 registro (trigger context padrão)
- **Bulk 200**: 200 registros (máximo trigger context)
- **Bulk 2000**: 2000 registros (Batch scope máximo)
- **Mixed**: Cenários realistas (ex: 50 records com 5 child records cada)

### 3. CPU Time Estimation
- Complexidade ciclomática por método
- Nested loops detection
- Collection sizes (List/Map/Set operations)
- JSON serialize/deserialize overhead
- Crypto operations
- Regex operations

### 4. Heap Size Estimation
- Tamanho de variáveis em escopo
- Collections (List/Map/Set) com estimated record sizes
- JSON strings (request/response bodies)
- Base64 encoded data
- View State (se Visualforce)

### 5. Risk Classification
| Métrica | LOW | MEDIUM | HIGH | CRITICAL |
|---------|-----|--------|------|----------|
| SOQL % do limite | <50% | 50-70% | 70-90% | >90% |
| DML % do limite | <50% | 50-70% | 70-90% | >90% |
| CPU % do limite | <50% | 50-70% | 70-90% | >90% |
| Heap % do limite | <50% | 50-70% | 70-90% | >90% |

## Interface de Uso (para @sf-auditor)

### Entrada
```json
{
  "scope": "force-app/main/default/classes/PropostaService.cls",
  "method": "processarPropostasEmLote",
  "scenarios": ["single", "bulk_200", "bulk_2000"],
  "context": "jornada-onboarding-pj"
}
```

### Saída Esperada
```json
{
  "class": "PropostaService",
  "method": "processarPropostasEmLote",
  "scenarios": {
    "single": {
      "soql": 3,
      "dml": 2,
      "dml_rows": 15,
      "callouts": 1,
      "cpu_estimate_ms": 120,
      "heap_estimate_kb": 450,
      "risk": "LOW"
    },
    "bulk_200": {
      "soql": 3,
      "dml": 2,
      "dml_rows": 200,
      "callouts": 1,
      "cpu_estimate_ms": 2800,
      "heap_estimate_kb": 8500,
      "risk": "MEDIUM",
      "warnings": [
        "CPU 2800ms (28% do limite síncrono) - aceitável",
        "Heap 8.5MB (70% do limite 12MB assíncrono) - monitorar"
      ]
    },
    "bulk_2000": {
      "soql": 3,
      "dml": 2,
      "dml_rows": 2000,
      "callouts": 1,
      "cpu_estimate_ms": 28000,
      "heap_estimate_kb": 85000,
      "risk": "CRITICAL",
      "warnings": [
        "CPU 28s EXCEDE limite síncrono (10s) - DEVE ser assíncrono (Queueable/Batch)",
        "Heap 85MB EXCEDE limite (12MB) - processar em chunks menores"
      ]
    }
  },
  "limit_breakdown": {
    "soql": { "limit": 100, "max_used": 3, "headroom": 97 },
    "dml": { "limit": 150, "max_used": 2, "headroom": 148 },
    "dml_rows": { "limit": 10000, "max_used": 2000, "headroom": 8000 },
    "callouts": { "limit": 100, "max_used": 1, "headroom": 99 },
    "cpu": { "limit_ms": 10000, "max_used_ms": 28000, "headroom_pct": -180 },
    "heap": { "limit_kb": 12288, "max_used_kb": 85000, "headroom_pct": -592 }
  },
  "recommendations": [
    "Mover processarPropostasEmLote para Queueable/Batchable",
    "Implementar chunking de 200 registros por execução",
    "Usar UnitOfWork para batching DML",
    "Considerar Platform Events para desacoplamento"
  ]
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-auditor` no Well-Architected Check (Pilar Adaptable)
- Fornece evidência quantitativa para @sf-architect recomendar async patterns
- Valida se código documentado no @sf-deep-diver escala para produção
- Alerta CRITICAL → falha auditoria se não houver mitigação documentada