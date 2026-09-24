#!/bin/bash

# Salesforce Archaeologist - Test Validation Script
# Uso: ./test-skill.sh

set -e

ORG_ALIAS="<seu-org-alias>"
SKILL_ROOT=".claude/skills/sf-archaeologist"
AGENTS_ROOT=".claude/agents"
DOCS_ROOT="docs/archaeologist"

echo "=============================================="
echo "Salesforce Archaeologist - Test Validation"
echo "ORG Alias: $ORG_ALIAS"
echo "=============================================="
echo ""

# Verificar estrutura de arquivos da skill
echo "Verificando estrutura da skill..."
for file in \
    "$SKILL_ROOT/SKILL.md" \
    "$AGENTS_ROOT/sf-surveyor.md" \
    "$AGENTS_ROOT/sf-deep-diver.md" \
    "$AGENTS_ROOT/sf-auditor.md" \
    "$AGENTS_ROOT/sf-architect.md" \
    ".claude/rules/salesforce-standards.md" \
    ".claude/skills/sf-archaeologist/evaluations/evals.json" \
    "CLAUDE.md" \
    "AGENTS.md" \
    "LICENSE"; do
    if [ -f "$file" ]; then
        echo "  OK $file"
    else
        echo "  FALTANDO $file"
        exit 1
    fi
done

# Verificar playbooks de análise
echo ""
echo "Verificando playbooks de análise integrados..."
OFFICIAL_SKILLS=(
    "apex-analyzer"
    "flow-inspector"
    "lwc-extractor"
    "integration-contract-builder"
    "well-architected-checker"
    "apex-governor-limits-validator"
    "salesforce-metadata-cataloger"
    "flow-surveyor"
    "arcfile-generator"
    "c4-modeler"
)

for skill in "${OFFICIAL_SKILLS[@]}"; do
    if [ -f ".claude/skills/analysis-playbooks/$skill/SKILL.md" ]; then
        echo "  OK $skill"
    else
        echo "  FALTANDO $skill"
        exit 1
    fi
done

# Verificar scripts determinísticos + selftests fail-closed
echo ""
echo "Verificando scripts determinísticos..."
for file in \
    ".claude/skills/analysis-playbooks/lwc-extractor/scripts/lwc-apex-callgraph.mjs" \
    ".claude/skills/analysis-playbooks/lwc-extractor/selftest/verify-callgraph.mjs" \
    ".claude/skills/sf-archaeologist/scripts/audit-cache.mjs" \
    ".claude/skills/sf-archaeologist/selftest/verify-audit-cache.mjs"; do
    if [ -f "$file" ]; then
        echo "  OK $file"
    else
        echo "  FALTANDO $file"
        exit 1
    fi
done

if command -v node >/dev/null 2>&1; then
    echo "  Rodando selftest lwc-apex-callgraph..."
    node .claude/skills/analysis-playbooks/lwc-extractor/selftest/verify-callgraph.mjs || exit 1
    echo "  Rodando selftest audit-cache..."
    node .claude/skills/sf-archaeologist/selftest/verify-audit-cache.mjs || exit 1
else
    echo "  AVISO: node não encontrado, pulando selftests (rode manualmente antes de confiar nos scripts)"
fi

# Verificar comandos slash
echo ""
echo "Verificando comandos slash..."
for cmd in \
    ".claude/commands/archaeologist-survey.md" \
    ".claude/commands/archaeologist-dig.md" \
    ".claude/commands/archaeologist-model.md"; do
    if [ -f "$cmd" ]; then
        echo "  OK $cmd"
    else
        echo "  FALTANDO $cmd"
        exit 1
    fi
done

# Simular Fase 1: Survey
echo ""
echo "SIMULACAO - Fase 1: Survey (Reconhecimento KDM)"
echo "   Comando: /archaeologist survey"
echo "   Subagente: @sf-surveyor"
echo "   Skills: salesforce-metadata-cataloger, flow-surveyor"
echo "   Output: $DOCS_ROOT/CAPABILITIES_MAP.md"
echo ""

# Verificar se force-app existe (simulacao)
if [ -d "force-app/main/default" ]; then
    echo "  force-app/main/default encontrado"
    APEX_COUNT=$(find force-app/main/default -name "*.cls" 2>/dev/null | wc -l)
    TRIGGER_COUNT=$(find force-app/main/default -name "*.trigger" 2>/dev/null | wc -l)
    FLOW_COUNT=$(find force-app/main/default -name "*.flow-meta.xml" 2>/dev/null | wc -l)
    LWC_COUNT=$(find force-app/main/default/lwc -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    
    echo "  Contadores simulados:"
    echo "     Apex Classes: $APEX_COUNT"
    echo "     Triggers: $TRIGGER_COUNT"
    echo "     Flows: $FLOW_COUNT"
    echo "     LWC Components: $LWC_COUNT"
else
    echo "  AVISO: force-app/main/default NAO encontrado (org nao deployada)"
    echo "     Para testar com org real: sf project deploy preview --source-dir force-app/main/default"
fi

# Simular Fase 2: Deep Dive
echo ""
echo "SIMULACAO - Fase 2: Deep Dive (Escavacao SBAR)"
echo "   Comando: /archaeologist dig <jornada>"
echo "   Subagente: @sf-deep-diver"
echo "   Skills: apex-analyzer, lwc-extractor, integration-contract-builder"
echo "   Niveis: Triggering Context -> Validation Gateways -> State Mutation -> Outbound Integrations -> Post-Processing"
echo "   Output: \$DOCS_ROOT/journeys/<jornada>.md"
echo ""

# Simular Fase 3: Audit Loop
echo ""
echo "SIMULACAO - Fase 3: Audit Loop (Validacao Deterministica)"
echo "   Subagente: @sf-auditor"
echo "   Skills: well-architected-checker, apex-governor-limits-validator"
echo "   Verificacoes: Callouts, VRs, DML, SOQL, Triggers, Flows, LWC->Apex, Well-Architected"
echo "   Criterio: Paridade 100% (contadores codigo vs doc)"
echo "   Loop: max 5 iteracoes ate VERIFIED_100_PERCENT"
echo ""

# Simular Fase 4: Model
echo ""
echo "SIMULACAO - Fase 4: Model (Sintese C4 & Arcfile)"
echo "   Comando: /archaeologist model <jornada>"
echo "   Subagente: @sf-architect"
echo "   Skills: arcfile-generator, c4-modeler"
echo "   Diagramas: Sequence, ERD, Target Architecture"
echo "   Export: .arc, .svg, .html, .webm"
echo "   Output: \$DOCS_ROOT/diagrams/<jornada>.*"
echo ""

# Validar consistencia de paths
echo ""
echo "Validando consistencia de paths..."
PATHS=(
    "$DOCS_ROOT/CAPABILITIES_MAP.md"
    "$DOCS_ROOT/journeys"
    "$DOCS_ROOT/technical"
    "$DOCS_ROOT/diagrams"
)

for path in "${PATHS[@]}"; do
    if [ -d "$(dirname "$path")" ] || [ -f "$path" ]; then
        echo "  OK $path (diretorio existe)"
    else
        echo "  DIR $path (sera criado na execucao)"
    fi
done

# Verificar referencias cruzadas
echo ""
echo "Validando referencias cruzadas..."

# Verificar se SKILL.md referencia subagentes corretos
if grep -q "@sf-surveyor" "$SKILL_ROOT/SKILL.md" && \
   grep -q "@sf-deep-diver" "$SKILL_ROOT/SKILL.md" && \
   grep -q "@sf-auditor" "$SKILL_ROOT/SKILL.md" && \
   grep -q "@sf-architect" "$SKILL_ROOT/SKILL.md"; then
    echo "  OK SKILL.md referencia todos os 4 subagentes"
else
    echo "  FALHA SKILL.md nao referencia todos os subagentes"
fi

# Verificar se subagentes referenciam playbooks
if grep -q "salesforce-metadata-cataloger" "$AGENTS_ROOT/sf-surveyor.md" && \
   grep -q "apex-analyzer" "$AGENTS_ROOT/sf-deep-diver.md" && \
   grep -q "well-architected-checker" "$AGENTS_ROOT/sf-auditor.md" && \
   grep -q "arcfile-generator" "$AGENTS_ROOT/sf-architect.md"; then
    echo "  OK Subagentes referenciam playbooks corretos"
else
    echo "  FALHA Referencias a playbooks incompletas"
fi

# Verificar Source Linkage padrao
if grep -q "Source Linkage" "$SKILL_ROOT/SKILL.md" && \
   grep -q "Source Linkage" "$AGENTS_ROOT/sf-deep-diver.md" && \
   grep -q "Source Linkage" "$AGENTS_ROOT/sf-auditor.md" && \
   grep -q "Source Linkage" "$AGENTS_ROOT/sf-architect.md"; then
    echo "  OK Source Linkage padronizado em todos os subagentes"
else
    echo "  FALHA Source Linkage nao padronizado"
fi

# Verificar salesforce-standards.md referenciado
if grep -q "salesforce-standards.md" "$SKILL_ROOT/SKILL.md" && \
   grep -q "salesforce-standards.md" "$AGENTS_ROOT/sf-surveyor.md" && \
   grep -q "salesforce-standards.md" "$AGENTS_ROOT/sf-deep-diver.md" && \
   grep -q "salesforce-standards.md" "$AGENTS_ROOT/sf-auditor.md" && \
   grep -q "salesforce-standards.md" "$AGENTS_ROOT/sf-architect.md"; then
    echo "  OK salesforce-standards.md referenciado em todos os arquivos"
else
    echo "  FALHA salesforce-standards.md nao referenciado em todos"
fi

# Verificar que os 4 subagentes tem frontmatter valido (name + description)
echo ""
echo "Verificando frontmatter dos subagentes..."
for agent in sf-surveyor sf-deep-diver sf-auditor sf-architect; do
    if head -1 "$AGENTS_ROOT/$agent.md" | grep -q "^---$" && \
       grep -q "^name: $agent$" "$AGENTS_ROOT/$agent.md" && \
       grep -q "^description:" "$AGENTS_ROOT/$agent.md"; then
        echo "  OK $agent.md (name + description presentes)"
    else
        echo "  FALHA $agent.md sem frontmatter valido"
        exit 1
    fi
done

# Verificar que nenhum SKILL.md usa o campo invalido "tools:" (deve ser
# allowed-tools, ou nenhum -- tools: é campo de subagente, nao de skill)
echo ""
echo "Verificando frontmatter dos SKILL.md (sem campo 'tools:' invalido)..."
if grep -rl "^tools:" .claude/skills --include="SKILL.md" >/dev/null 2>&1; then
    echo "  FALHA algum SKILL.md ainda usa o campo 'tools:' (invalido para Skills)"
    exit 1
else
    echo "  OK nenhum SKILL.md usa 'tools:' invalido"
fi

# Validar evaluations/evals.json
echo ""
echo "Verificando evaluations/evals.json..."
if python3 -c "import json; json.load(open('.claude/skills/sf-archaeologist/evaluations/evals.json'))" 2>/dev/null; then
    echo "  OK evaluations/evals.json é JSON válido"
else
    echo "  FALHA evaluations/evals.json ausente ou invalido"
    exit 1
fi

echo ""
echo "=============================================="
echo "TESTE DE VALIDACAO CONCLUIDO COM SUCESSO"
echo "=============================================="
echo ""
echo "Resumo da Skill Salesforce Archaeologist:"
echo "  - 1 Skill Principal (Orquestrador)"
echo "  - 4 Subagentes Operacionais"
echo "  - 10 Playbooks de Análise Integrados"
echo "  - 1 Arquivo de Regras (salesforce-standards.md)"
echo "  - 3 Comandos Slash (survey, dig, model)"
echo "  - 4 Fases com Loop de Validacao Deterministica"
echo "  - Output: CAPABILITIES_MAP + Jornadas + Diagramas Arcfile/C4"
echo ""
echo "Para usar com org real (substitua $ORG_ALIAS):"
echo "  1. sf org login web --alias $ORG_ALIAS"
echo "  2. sf project retrieve start --source-dir force-app/main/default"
echo "  3. claude '/archaeologist survey'"
echo "  4. claude '/archaeologist dig <jornada>'"
echo "  5. claude '/archaeologist model <jornada>'"