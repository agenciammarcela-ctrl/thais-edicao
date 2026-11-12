# Estilo 3 — Amiga (scrapbook íntimo)

> **Versão Thaís (feedback da Marcela, 2026-11-12) — a regra de ouro é FAZER
> SENTIDO com o assunto do vídeo E TER HUMOR.**
> - **Piada da Thaís → meme** que reage àquela frase (bicho real ou cena de
>   filme conhecida): "a marmita tá lá olhando na cara dela" → gato julgando;
>   "segunda eu volto" → gato largado no sofá; "inventar a moda de treinar" →
>   cachorrinho na esteira (ela adorou); "fique orgulhosa" → DiCaprio brindando.
>   Meme solto/sem ligação com a fala (hamster, gato de óculos) = infantil, não usar.
> - **Dica da Thaís → lifestyle do tema** (pessoa real, estético, internacional):
>   menina treinando, bowl de proteína, poke, meal prep, cozinhando, pilates.
> - **Stickers do ASSUNTO**, não fofura aleatória: abacate, halter, bowl de
>   salada, garrafinha "drink your water", iced coffee — no gancho (4 em volta
>   dela), quando a fala cita o objeto ("aplicativo de beber água" → garrafinha)
>   e no CTA. Stickers de Pinterest usam `"recorte": true` (o motor apaga o fundo
>   liso lido nos cantos e põe contorno branco).
> - Nada de flor em dupla exposição nem `luz`; `brilho` só em orgulho/CTA.
> - Bicho ou pessoa de IA fica de fora.
> - Vídeos da Thaís vão em **`"velocidade": 1.12`** e o B-roll em caixa fica
>   **atrás dela** (`pessoaNaFrente`, padrão) — nunca cortar a cabeça.

Referência analisada quadro a quadro: @larissalodisalum ("5 conselhos que eu
te daria como amiga", 44 s; "a síndrome da boazinha", 1min47s — 35 mil
curtidas e 3,4 mil compartilhamentos). Conteúdo de "manda pra amiga": muito
compartilhamento, pouco comentário.

## A sensação
Uma conversa de quarto, no fim da tarde, com a amiga que faz terapia. Nada
parece produzido — mas tudo é bonito. A edição é decoração (adesivos,
flores, luz), não ritmo.

## Gravação ideal (passe para a Thais)
- Câmera frontal/selfie, levemente grande-angular, na altura dos olhos.
- Sentada no chão ou na cama; quarto com madeira, roupa de cama clara.
- **Luz natural de janela, quente** (golden hour). Nada de ring light.
- Roupa aconchegante (moletom, cachecol, tricô) em tons neutros/verde/bege.
- Pode segurar o microfone sem fio na mão e um caderno de onde "lê" — faz parte.
- Uma tomada só, sem trocar enquadramento. **Deixe espaço acima da cabeça**
  (a legenda mora no terço de cima, a ~22% da altura).

## Estrutura
| Trecho | O que acontece |
|---|---|
| 0 – ~4 s (gancho) | **Colagem de adesivos** (3–7 PNGs) ao redor dela + **título grande** ("5 CONSELHOS") com estrelas douradas. A legenda vira subtítulo pequeno logo abaixo do título. |
| corpo | Tomada contínua. Legenda em **frase que se acumula** palavra por palavra. A cada 8–15 s uma **camada de atmosfera**: dupla exposição (flor), vazamento de luz, partículas douradas ou B-roll na **caixa** do terço de cima. |
| fim | Frase de fechamento afetiva ("manda pra uma amiga…"), de preferência com `brilho` ou `luz`. |

## Camadas e números
- **Título**: Fredoka Bold 132 px branco com sombra suave, a 20% da altura;
  `estrelas: 5` (★ douradas `#F5C542`, entram uma a uma). Texto curto em
  CAIXA ALTA: "5 CONSELHOS", "3 SINAIS", "A SÍNDROME DA BOAZINHA". `ate` = fim
  da primeira frase (3–5 s).
- **Legenda**: DM Sans Itálico 50 px, amarelo-creme `#F8E9A9`, **tudo em
  minúsculas** (palavras inteiras em CAIXA ALTA, como "TUDO", são mantidas
  para dar ênfase), largura 660 px, centro a 22% da altura. A frase inteira
  vai aparecendo palavra por palavra e fica na tela até a próxima frase.
  Itens de lista mantêm o número: "1. o dia que você planta a semente…".
  Destaque `*palavra*` = **sublinhado** (1 por frase, no máximo). Fala
  citada vai entre aspas: “hoje eu não consigo fazer isso”.
- **Adesivos (`plano.adesivos`)**: PNG recortado, sombra leve, entram com
  mola em sequência e flutuam. Temas: flor (lírio, lótus), xícara de café vista
  de cima, sapinho/objeto fofo, bilhete escrito à mão, estrelas, foto
  pequena tipo polaroid. Posições nas bordas (x 0,1–0,25 ou 0,75–0,9), nunca
  sobre o rosto. Larguras 0,18–0,3. Rotação −12° a +12°. Só no gancho (e
  no máximo mais uma vez no vídeo).
- **Dupla exposição (`efeitos` tipo `sobreposicao`)**: foto/vídeo de flor
  grande (lírio, lótus, pétalas) em modo screen, opacidade 0,45–0,6, 2–3 s,
  na frase mais sensível.
- **Luz (`tipo: luz`)**: vazamento quente/rosa/dourado, 2–3 s, em virada de
  pensamento ("e foi aí que eu entendi…").
- **Brilho (`tipo: brilho`)**: partículas douradas subindo, 1,5–2,5 s, em
  conquista/libertação ou no fechamento.
- **B-roll (`layout: caixa`)**: faixa no terço de cima, fade curto. Imagens
  **metafóricas e cinematográficas**, não literais: filme antigo de mulheres
  de bicicleta, close de olho, silhueta dançando na janela, mãos dobrando
  roupa, campo, mar. Granulado/vintage combina. 2–4 s cada.
- **Zoom**: nenhum (`zoomAuto: false`). O token já aplica um empurrão lento de
  4% ao longo do vídeo inteiro.
- **Cor**: quente, sombras levantadas, leve sépia (no token).

## Ritmo medido nas referências
- Praticamente sem cortes visíveis; só pausas longas são removidas
  (`npm run cortes -- <nome> 0.6`).
- Um evento de atmosfera a cada 8–15 s. Vídeos de 40 s a 2 min.

## Checklist do estilo
- [ ] Gancho: título + estrelas + 3 ou mais adesivos, nenhum sobre o rosto
- [ ] Legenda em minúsculas, itálico creme, no terço de cima, sem cobrir os olhos
- [ ] Frases acumulam palavra por palavra (compare dois frames da mesma frase)
- [ ] Pelo menos uma dupla exposição ou luz por 30 s de vídeo
- [ ] B-roll só na caixa de cima e metafórico
- [ ] Nenhuma faixa vermelha, flash, cartela escura ou zoom de corte (são de outros estilos)
