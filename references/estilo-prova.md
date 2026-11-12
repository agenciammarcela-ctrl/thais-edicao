# Estilo 1 — Prova (análise com evidência)

Referências analisadas quadro a quadro: @elias.maman ("o YouTube paga, o
TikTok paga…", 2min58s) e @leticiavaz ("analisei a Wepink", 2 min — 35 mil
curtidas e 9,3 mil comentários com CTA "comenta QUERO").

## A sensação
"Eu estudei isso e vou te provar." Cada afirmação vem com uma evidência na
tela: manchete, print, número. Ritmo rápido, capítulos claros.

## Gravação ideal
- Sentada a uma mesa, plano médio, câmera travada, luz de estúdio com contraste
  (ambiente escuro e quente com luzes práticas) OU parede clara e lisa com
  muito espaço acima da cabeça (para anotações).
- Fala em capítulos ("estratégia 1… estratégia 2…"), olhando para a lente.

## Estrutura
| Trecho | O que acontece |
|---|---|
| 0 – ~7 s (gancho) | Tela dividida: B-roll de cada "personagem" citado em cima (marca, plataforma, pessoa), Thais embaixo; legenda na divisão. |
| virada | **Flash branco** (0,35 s) ao sair do gancho para o corpo. |
| corpo | Zoom alternado forte (1,00 ↔ 1,18) a cada corte. **Prova** a cada afirmação importante: manchete (fundo P&B desfocado + caixa branca) ou prints empilhados. **Cartela de capítulo** a cada ~30 s. |
| fim | CTA de comentário com palavra-chave ("comenta QUERO que te mando…"). |

## Camadas e números
- **Legenda**: Playfair Display SemiBold 54 px, dourado `#E8B84A`, centro a
  50%, 1–3 palavras. Destaque = amarelo mais claro e mais grosso.
- **Cartela (`plano.cartelas`)**: tela cheia escura `#0B1210` com brilho
  dourado no centro; frase pequena (DM Sans 50 px, creme) + palavra-chave
  grande (Playfair Display ExtraBold Itálico 124 px, dourado `#F2C94C` com
  glow) entrando com desfoque. 2–3 s. Ex.: pre "eles tiveram" / destaque
  "prejuízo"; pre "transição de autoridade real para" / destaque "autoridade
  percebida". A voz continua por baixo.
- **Prova manchete**: Thais vira P&B + desfoque; caixa branca 640 px com a
  manchete em serifa preta (Playfair 58 px) e a fonte em cinza. 2–3 s. Sem
  legenda por cima. Use manchete REAL com fonte — nunca invente.
- **Prova print**: prints (perfis, tabelas, buscas) empilhando com leve
  rotação, sobre o fundo P&B desfocado. Bom para "olha quantos perfis…".
- **B-roll**: `topo` no gancho e para pessoas/marcas citadas; `tela-cheia`
  raro.
- **Flash**: `efeitos: [{tipo: 'flash', em: <fim do gancho>}]`.

## Variação "caderno" (@leticiavaz) — ainda não automatizada
Anotações à mão na parede (letra cursiva, marca-texto amarelo, círculos e
setas desenhados, tabelas e produtos recortados que se escrevem junto com a
fala) exigem motion design por vídeo. Hoje o motor não gera isso; se pedirem,
avise e sugira as cartelas + provas no lugar, ou proponha criar o componente.

## Checklist do estilo
- [ ] Gancho com tela dividida e flash na saída
- [ ] Zoom forte alternando a cada corte
- [ ] Toda afirmação com número/estudo tem uma prova na tela
- [ ] Cartela a cada ~30 s, palavra-chave legível com glow
- [ ] Nenhuma legenda sobre a manchete
- [ ] CTA final com palavra-chave de comentário
