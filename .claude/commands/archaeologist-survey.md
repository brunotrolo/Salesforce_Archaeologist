---
description: Executa survey completo da org Salesforce (Fase 1 - Reconhecimento KDM)
---

# Survey Salesforce Org

Executa a Fase 1 do Salesforce Archaeologist: reconhecimento raso (KDM & AST Outlining) de 100% da árvore de metadados em `force-app/main/default`.

## O que faz

1. Invoca `@sf-surveyor` para varredura token-efficient
2. Extrai assinaturas Apex, anotações, metadados XML via `rg`/`find`
3. Classifica todas as camadas KDM: Structure, Data, Behavior, Interface, Integration, Platform
4. Aciona playbooks de análise: `salesforce-metadata-cataloger`, `flow-surveyor`
5. Gera `docs/archaeologist/CAPABILITIES_MAP.md` com inventário quantitativo e qualitativo

## Pré-requisitos

- Org no formato SFDX Source (`force-app/main/default` existente)
- Ferramentas: `rg` (ripgrep), `find`

## Saída Esperada

```
docs/archaeologist/CAPABILITIES_MAP.md
├── Resumo Quantitativo (contadores por categoria)
├── Tabelas por Camada KDM (Tipo, API Name, Propósito, Pontos de Contato, Status)
├── Mapa de Dependências Cross-Layer
└── Débito Técnico Identificado (Survey Level)
```

## Uso

```
/archaeologist survey
```

Ou invoque diretamente o subagente:
```
@sf-surveyor execute survey completo em force-app/main/default
```