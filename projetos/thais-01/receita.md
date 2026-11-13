# Receita — thais-01 · "Como ser magra tomando cerveja" (estilo autoridade)

Bruto: Drive "2 vídeos brutos" (copy_3B10BA0D…mov), 1min50s → final **1min14s** em 1.12x.

```bash
npm run justo -- thais-01
npm run remover -- thais-01 --exato 24.5-32.2 60.3-61.72 85.6-94.35
npm run conferir -- thais-01 --aplicar   # depois: correções manuais de legenda abaixo
```

| Corte (bruto, s) | O que sai | Por quê |
|---|---|---|
| 24.5–32.2 | 1ª tentativa "Significa que o meu organismo…" | regravação |
| 60.3–61.72 | "e eu sigo a…" (antes de "e eu sigo a regra dos 80 a 20") | tropeço/recomeço |
| 85.6–94.35 | 1ª tentativa "E é isso que eu ensino no BMT…" | regravação |

Legenda: "não cai do **céu**" (whisper: "seu"), "manda pra uma amiga que acha **que**
precisa…" (faltava o "que"), "e eu sigo a regra dos **80** a 20" retranscrito no trecho.
Fotos da Thaís: corpo (52), treino com kettlebell (69), antes/depois (09), notebook (45).

**Sincronia (2026-11-13):** o .mov do iPhone tem o áudio começando 0,785 s depois do vídeo;
o WAV de análise ignorava isso e todos os tempos ficaram adiantados (início fora de sincronia,
"cerveja" engolido). `npm run alinhar -- thais-01` preencheu o áudio de silêncio desde o 0 e
deslocou cortes/legendas/camadas +0,785 s. Os tempos da tabela acima são de ANTES do alinhamento.
