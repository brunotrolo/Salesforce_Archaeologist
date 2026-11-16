// Política do odin-guard para esta skill (ADR 0027 do Odin): somente leitura na org.
// O Archaeologist lê a org inteira para mapear o legado; nunca grava dados, nunca faz deploy, nunca executa Apex anônimo.
// Substitui as regras `permissions.deny` do settings.json (que o Odin não entrega) e vai além delas.
const MUTACAO = [
  [/\bsf\b[\s\S]*\borg\b[\s\S]*\bdelete\b/, 'sf org delete (apaga uma org)'],
  [/\bsf\b[\s\S]*\bproject\b[\s\S]*\bdelete\b/, 'sf project delete (apaga código-fonte)'],
  [/\bsf\b[\s\S]*\bdata\b[\s\S]*\b(create|update|delete|upsert|import|bulk|resume)\b/, 'sf data create/update/delete/upsert/import (grava dados na org)'],
  [/\bsf\b[\s\S]*\bproject\b[\s\S]*\bdeploy\b[\s\S]*\b(start|quick|resume)\b/, 'sf project deploy (muda a org)'],
  [/\bsf\b[\s\S]*\bapex\b[\s\S]*\brun\b(?![\s\S]*\btest\b)/, 'sf apex run (Apex anônimo pode gravar na org)'],
  [/\bsf\b[\s\S]*\bpackage\b[\s\S]*\b(install|uninstall)\b/, 'sf package install/uninstall (muda a org)'],
];

export default function politica(evento) {
  if (evento?.tool_name !== 'Bash' && evento?.tool_name !== 'PowerShell') return null;
  const comando = String(evento?.tool_input?.command ?? '').toLowerCase();
  for (const [re, motivo] of MUTACAO) if (re.test(comando)) return { decisao: 'negar', motivo: `Esta skill só lê a org (engenharia reversa): ${motivo} está fora do escopo. Faça manualmente, fora do Claude Code, se for realmente necessário.` };
  return null;
}
