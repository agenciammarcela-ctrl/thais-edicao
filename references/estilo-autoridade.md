# Estilo 2 — Autoridade (documentário com B-roll literal)

Referência analisada quadro a quadro: @dra.lilianalimongi
("Esse é o cabelo da mulher dos anos 80…", 2min58s; "Você não tá ficando
careca porque…", 2min50s). Vídeos longos (2–3 min) que seguram pela
curiosidade do roteiro + B-roll que ilustra cada ideia.

## A sensação
Consulta com uma especialista que você confia. Calma, quente, segura. A
edição é quase invisível: ela não chama atenção para si, só garante que nunca
falta imagem para o que está sendo dito.

## Gravação ideal (passe para a Thais)
- Sentada a uma mesa de madeira, mãos à vista (gesticula sobre a mesa).
- Plano médio: do topo da cabeça até a cintura, rosto no terço de cima.
- Fundo com textura e profundidade (cortina listrada, ripado, estante),
  desfocado. Luz quente lateral, tipo fim de tarde.
- Roupa lisa escura + um acessório marcante (colar). Câmera parada no tripé.
- Deixe ~15% de folga acima da cabeça (o zoom alternado precisa de margem).

## Estrutura
| Trecho | O que acontece |
|---|---|
| 0 – ~7 s (gancho) | **Tela dividida**: B-roll do problema na metade de cima, Thais na de baixo. **Faixa vermelha de título** na linha da divisão, parada durante todo o gancho. Sem legenda nesse trecho. |
| corpo | Thais em tela cheia com **zoom alternado** a cada corte (1,00 ↔ 1,14). B-roll a cada 10–25 s: alterna **topo** (meia tela) e **tela cheia**, 3–6 s cada. |
| fim | Volta para a Thais sem B-roll na conclusão/CTA — o rosto fecha o vídeo. |

## Camadas e números
- **Título (`plano.titulo`)**: Montserrat ExtraBold, branco, fundo vermelho
  `#C8191E`, bloco retangular de até 960 px, centralizado em 50% da altura.
  Texto em Title Case, formato manchete de YouTube, 2 linhas:
  "Esse É o Verdadeiro Motivo da…", "Mulher: Esse É o Real Motivo da Sua…".
  `ate` = fim da primeira ou segunda frase (5–8 s).
- **Legenda**: Poppins Medium 56 px, creme `#F3E4C8` com sombra, centro em
  50% da altura (fica na linha da divisão quando a tela está dividida). 1–3
  palavras por bloco (máx. 16 caracteres). Discreta de propósito: não compete
  com o rosto. Destaque `*palavra*` = branco + mais grosso — use pouco (1 a
  cada 15–20 s, em termos-chave: nutriente, doença, número).
- **B-roll literal**: ilustra a PALAVRA que está sendo dita. "vilã" → pessoa
  passando mal; "comer" → alguém comendo; "anos 80" → imagem anos 80;
  "procedimento" → mãos de luva. Mulheres reais, cenas do cotidiano, tom
  emocional. `topo` com `focoY` ajustado para o rosto/assunto não ser cortado.
  `tela-cheia` para os momentos de impacto (máx. 1 a cada 30 s).
- **Zoom**: automático alternado (deixe `zoomAuto: true`). Use `plano.zoom`
  para um close extra (1,22) num gesto enfático ou frase de impacto.
- **Cor**: quente, leve sépia (já no token). Nenhum efeito de luz/partícula.

## Ritmo medido nas referências
- Trechos da Thais entre cortes: 2–8 s (cortes só removem pausas).
- B-roll: ~6–8 inserções por minuto de vídeo nos primeiros 60 s, depois
  ~3–4 por minuto.
- Duração total típica: 2–3 min.

## Checklist do estilo (passe nos frames do snap)
- [ ] Gancho tem tela dividida + faixa vermelha legível, rosto inteiro na metade de baixo
- [ ] Nenhuma legenda por cima da faixa vermelha
- [ ] Zoom muda a cada corte (compare dois frames vizinhos de trechos diferentes)
- [ ] Cada B-roll mostra literalmente o que está sendo dito naquele segundo
- [ ] Nada além de 25 s sem B-roll
- [ ] Final sem B-roll, rosto da Thais
- [ ] Nenhum efeito de luz, partícula, adesivo ou flash (isso é de outro estilo)
