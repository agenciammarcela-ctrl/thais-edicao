# plano.json — referência de todos os campos

Dois relógios:
- **`em`** (e `t`/`f` das legendas, `cortes`, `titulo.ate`, `zoom.em`) =
  segundos do **BRUTO**, o mesmo relógio da `transcricao.txt`.
- **`dur`** = segundos do **vídeo final**.

Se um `em` cair num trecho cortado, o evento vai para o início do próximo
trecho mantido. Mexer em `cortes` nunca desalinha nada.

Caminhos de arquivo são relativos à pasta do projeto (`broll/x.mp4`).

```jsonc
{
  "estilo": "autoridade",          // autoridade | amiga | prova
  "video": "bruto.mp4",
  "fps": 30,
  "rostoY": 0.32,                  // altura do rosto no bruto (0 topo – 1 base); enquadra a meia tela de baixo
  "legendaY": 0.66,                // opcional: centro da legenda quando a tela não está dividida
  "cortes": [[0.52, 4.10], [4.80, 9.33]],   // trechos do bruto que FICAM
  "legendas": [                    // vem da transcrição; corrija só o texto
    { "t": 0.60, "f": 0.82, "texto": "Esse" },
    { "t": 2.10, "f": 2.55, "texto": "*ferro*" }      // *…* = destaque
  ],
  "zoomAuto": true,                // alterna zoom a cada corte (autoridade/prova)
  "zoom": [{ "em": 31.2, "escala": 1.22 }],         // zoom manual a partir de `em`

  "titulo": { "texto": "O Verdadeiro Motivo do Seu Cansaço", "ate": 6.5, "y": 0.17 },  // y opcional
  // amiga: { "texto": "5 CONSELHOS", "estrelas": 5, "ate": 3.8 }

  "broll": [
    { "arquivo": "broll/exame.mp4", "em": 12.4, "dur": 3.5, "layout": "topo", "inicio": 2, "focoY": 0.4 },
    { "arquivo": "broll/cafe.jpg",  "em": 40.0, "dur": 3,   "layout": "tela-cheia" },
    { "arquivo": "broll/janela.mp4","em": 22.0, "dur": 2.5, "layout": "caixa" }   // amiga
  ],

  "adesivos": [                    // amiga — PNG transparente
    { "arquivo": "adesivos/lirio.png", "em": 0, "dur": 3.5, "x": 0.15, "y": 0.42, "larg": 0.24, "rot": -10 }
  ],

  "efeitos": [
    { "tipo": "sobreposicao", "arquivo": "efeitos/flor.jpg", "em": 8.2, "dur": 2.5, "opacidade": 0.5 }, // amiga
    { "tipo": "luz", "em": 24, "dur": 2.2, "cor": "quente" },   // quente | rosa | dourada  (amiga)
    { "tipo": "brilho", "em": 77, "dur": 2 },                   // partículas douradas (amiga)
    { "tipo": "flash", "em": 7.4 }                              // flash branco (prova)
  ],

  "cartelas": [                    // prova
    { "em": 54.0, "dur": 2.6, "pre": "eles tiveram", "destaque": "prejuízo" }
  ],
  "provas": [                      // prova
    { "tipo": "manchete", "em": 78, "dur": 3, "texto": "Brunch e Youpix mapeiam relação entre creators e marcas", "fonte": "Meio & Mensagem, 2026" },
    { "tipo": "print", "em": 169, "dur": 2.5, "arquivos": ["provas/perfil1.png", "provas/perfil2.png"] }
  ],

  "musica": { "arquivo": "musica/fundo.mp3", "volume": 0.1, "inicio": 0 },

  "velocidade": 1.12,              // acelera o vídeo inteiro (voz sem ficar fina); padrão 1
  "pessoaNaFrente": true           // B-roll "caixa" passa ATRÁS da Thaís (recorte automático); padrão true
}
```

## Layouts de B-roll
| layout | Tela | A Thais | Estilos |
|---|---|---|---|
| `topo` | metade de cima | desce para a metade de baixo (rosto a ~40% da caixa) | autoridade, prova |
| `tela-cheia` | tudo | some (a voz continua) | autoridade, prova |
| `caixa` | terço de cima, com fade curto | continua inteira e **na frente** da imagem (recorte de pessoa via MediaPipe — a cabeça nunca é cortada; legenda desce para o peito) | amiga |

Com `velocidade`, os tempos `em` continuam sendo do BRUTO; `dur` continua em
segundos do vídeo final. O recorte de pessoa precisa de internet no render
(baixa o modelo uma vez) e deixa o render ~2× mais lento nos trechos com caixa.

## Ordem das camadas (de baixo para cima)
A-roll → B-roll → efeitos (exceto flash) → adesivos → provas → cartelas →
título → legenda → flash.

## Regras automáticas
- Legenda some sob a faixa de título (autoridade/prova), sob cartelas e sob
  manchetes.
- No estilo amiga, enquanto o título está na tela, a legenda vira subtítulo
  pequeno logo abaixo dele.
- Palavras de trechos cortados somem da legenda.
