---
name: arcfile-generator
description: "Playbook de análise Salesforce para geração e validação de diagramas Arcfile (Archify): sequence diagrams, ERDs, architecture diagrams. Compilação, exportação SVG/PNG/HTML/WebM. Use SEMPRE na Fase 4 para renderização visual validada."
---

# Playbook de Análise: Arcfile Generator

## Missão
Compilar, validar e exportar especificações Arcfile (.arc) em diagramas visuais profissionais (SVG, PNG, HTML interativo, WebM animation).

## Capacidades Principais

### 1. Gramática Arcfile (Archify)
Suporta:
- **Sequence Diagrams**: `sequence "Name" { actor/participant -> ... }`
- **ER Diagrams**: `er "Name" { entity { fields } relationship ... }`
- **Architecture/C4**: `architecture "Name" { context { boundary { component } } flows { flow } }`
- **Flowcharts**: `flow "Name" { node -> node }`
- **State Diagrams**: `state "Name" { state -> state }`

### 2. Validação & Compilação
- Parse da gramática Arcfile
- Verificação de referências (participants, entities, components existem)
- Validação de sintaxe (colchetes, chaves, aspas)
- Type checking de campos (ERD)

### 3. Exportação Multi-Formato
| Formato | Uso | Comando |
|---------|-----|---------|
| `.svg` | Documentação estática, embed em Markdown | `archify export diagram.arc -o diagram.svg` |
| `.png` | Apresentações, emails | `archify export diagram.arc -o diagram.png` |
| `.html` | Interativo (zoom, pan, tooltips, dark/light) | `archify export diagram.arc -o diagram.html` |
| `.webm` | Animação de sequence diagram (trace motion) | `archify export diagram.arc -o diagram.webm --animate` |
| `.mermaid` | Fallback para GitHub/Notion | `archify export diagram.arc -o diagram.mmd` |

### 4. Temas & Estilos
- Temas: `default`, `dark`, `light`, `monochrome`, `high-contrast`
- Cores customizadas por boundary/layer (C4)
- Ícones Salesforce (standard objects, custom objects, lightning)
- Fonte: Inter / Roboto Mono

### 5. Integração com Source Linkage
- Tooltips com `Source: arquivo:linha` ao hover
- Links clicáveis para abrir arquivo no VS Code (se `code://` protocol)
- Legend com cores por camada (Trusted/Easy/Adaptable)

## Interface de Uso (para @sf-architect)

### Entrada
```json
{
  "input_file": "docs/archaeologist/diagrams/onboarding-pj.arc",
  "output_formats": ["svg", "html", "webm"],
  "theme": "dark",
  "include_source_links": true,
  "animate_sequences": true
}
```

### Saída Esperada
```json
{
  "input": "docs/archaeologist/diagrams/onboarding-pj.arc",
  "outputs": {
    "svg": "docs/archaeologist/diagrams/onboarding-pj.svg",
    "html": "docs/archaeologist/diagrams/onboarding-pj.html",
    "webm": "docs/archaeologist/diagrams/onboarding-pj.webm"
  },
  "validation": {
    "valid": true,
    "diagrams_found": 3,
    "diagram_types": ["sequence", "er", "architecture"],
    "warnings": []
  },
  "metadata": {
    "generated_at": "2026-09-18T14:30:00Z",
    "theme": "dark",
    "source_links_embedded": true,
    "animation_enabled": true
  }
}
```

## Integração com Salesforce Archaeologist
- Acionada por `@sf-architect` na Fase 4 (Síntese C4 & Arcfile) - **obrigatória**
- Consome documentação `VERIFIED_100_PERCENT` do `@sf-auditor`
- Gera artefatos visuais para entrega final de assessment/migração
- HTML interativo → compartilhamento com stakeholders não-técnicos
- WebM animation → apresentação de fluxos complexos em reuniões
- SVG/PNG → inclusão em documentação Markdown/Confluence