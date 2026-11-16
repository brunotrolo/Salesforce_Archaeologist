# Avaliações desta skill

Casos em `casos.yaml`, verificadores em `graders/`. Rodar a camada determinística no repositório do Odin: `node scripts/avaliar-skill.ts <esta-pasta> <id-da-skill> <versao>`.
Os casos **negativos** e de **injeção** são críticos: se um falhar, a promoção para `stable` é bloqueada. Casos com modelo (`camada: modelo`) são acrescentados pelo mantenedor e rodam com `odin dev eval`.
