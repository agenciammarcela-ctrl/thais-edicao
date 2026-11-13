---
name: thais-edicao
description: Edita os vídeos verticais (Reels/TikTok/Shorts) da Thais a partir do vídeo bruto, num dos três estilos de edição da casa — Autoridade (documentário com B-roll literal e faixa vermelha de título), Amiga (scrapbook íntimo com adesivos, dupla exposição e legenda em frase) e Prova (análise com manchetes, cartelas de capítulo e flash). Use sempre que pedirem para editar, legendar, cortar, montar ou renderizar um vídeo da Thais, ou citarem "estilo 1/2/3", "autoridade", "amiga", "prova", "B-roll", "legenda", "corte seco", "jump cut".
---

# Edição dos vídeos da Thais

Você recebe um vídeo bruto (a Thais falando para a câmera) e entrega um MP4
vertical editado num dos três estilos. A edição inteira é descrita num único
arquivo — `projetos/<nome>/plano.json` — e o Remotion transforma o plano em
vídeo. Você nunca edita o vídeo "na mão": você escreve o plano, confere frames
e renderiza.

Estilos (o número é o da análise original das referências):

| Estilo | Nome no plano | Quando usar | Regras |
|---|---|---|---|
| 2 | `autoridade` | conteúdo técnico/especialista, tema polêmico, "o verdadeiro motivo" | `references/estilo-autoridade.md` |
| 3 | `amiga` | conselho, comportamento, emocional, listas "X coisas que…" | `references/estilo-amiga.md` |
| 1 | `prova` | análise, dados, marcas, "eu estudei X" | `references/estilo-prova.md` |

Os estilos **2 e 3 são os principais da Thais**. Use o 1 só quando pedirem.
Se ninguém disser o estilo, escolha pelo tema (tabela acima), diga qual
escolheu em uma frase e siga.

Leia a referência do estilo ANTES de escrever o plano. O formato completo do
plano está em `references/plano.md`.

## Pré-requisitos (uma vez por computador)

```bash
npm install
npm run instalar      # baixa e compila o whisper.cpp + modelo (transcrição local, ~1,5 GB)
```

Se `npm run instalar` não tiver sido rodado, peça para a pessoa rodar — ele
compila código e pode pedir permissão. Sem ele não há transcrição.

## Fluxo de trabalho

1. **Criar o projeto.** `npm run novo -- <nome> <estilo> <caminho/do/bruto.mp4>`
   Bruto num link do Google Drive? `npm run baixar -- <link da pasta ou do arquivo>`
   baixa para `_entrada/` (a pasta precisa estar como "qualquer pessoa com o link").
   Nome curto, sem espaço (`2026-11-cansaco`). O bruto é copiado para
   `projetos/<nome>/bruto.mp4` (fica fora do git).
   O `novo` já alinha o áudio ao vídeo (iPhone grava o áudio começando até 0,8 s
   depois do 1º quadro — sem isso legenda e corte ficam adiantados e o começo
   sai fora de sincronia). Projeto antigo: `npm run alinhar -- <nome>` uma vez.

2. **Transcrever.** `npm run transcrever -- <nome>`. Leia
   `projetos/<nome>/transcricao.txt` inteiro. Corrija no `plano.legendas` os
   erros de transcrição (nomes próprios, termos técnicos, marcas), sem mexer
   nos tempos. Nunca invente fala que não existe.

3. **Corte justo (padrão profissional).** `npm run justo -- <nome>` — mede o
   áudio em blocos de 10 ms (volume + chiado) e emenda fala com fala: tira
   respiração, pausa e "ar", deixando ~0,1 s de respiro. Limiares saem do
   próprio vídeo. A Marcela reprovou o corte "frouxo" (só pausas longas):
   **respiração entre frases SEMPRE sai**. (`npm run cortes` = modo antigo, só
   pausas longas — não usar para a Thaís.) Este comando SUBSTITUI os cortes.

4. **Limpar a fala — erros, regravações, tropeços.** Leia frase por frase:
   - regravação (fica a ÚLTIMA tentativa), frase começada e abandonada,
     tropeço ("Pois bem, **que** essa mulher"), recomeço ("e eu sigo a… e eu
     sigo a regra"), sobras depois do CTA;
   - mantenha o jeito dela (o "né?", o "uai", piadas).
   **Os tempos do whisper erram até ±0,25 s (e ~1 s no começo do vídeo)** —
   nunca corte direto neles. Olhe a ONDA no ponto: imprima o volume a cada
   20 ms (`scripts/audio.mjs` → `envelope`) e corte no vale de silêncio entre as
   palavras: `npm run remover -- <nome> --exato 60.3-61.72 214.0-fim`. Sem
   `--exato`, o remover "imanta" sozinho a borda no vale mais próximo (±0,15 s).
   Hesitações que o whisper limpa ("ééé", "e eu sigo a… e eu sigo a"):
   transcreva o áudio cortado com prompt de disfluência
   (`additionalArgs: [["--prompt", "Ééé... ahn, hum, é é, eu eu."]]`) e leia o
   contexto de cada "e/é" curto ou palavra repetida.

4b. **Conferir e refazer a legenda.** `npm run conferir -- <nome> --aplicar`
   monta o áudio cortado, transcreve de novo, lista palavra FALTANDO (cortada
   por engano) e troca a legenda pela transcrição do áudio cortado (bem mais
   sincronizada), herdando grafia corrigida e *destaques*. Revise as palavras
   que não casaram (o whisper erra "segunda"→"segundo", "do álcool"→"dual") e
   recoloque destaques se preciso. Meta: nada de conteúdo faltando; diferenças
   só de grafia.

5. **Desenhar a edição** seguindo a referência do estilo: gancho (título),
   B-roll (onde, qual layout, quanto tempo), destaques `*palavra*` na legenda,
   adesivos/efeitos (amiga), provas/cartelas (prova), zoom. Escreva tudo no
   `plano.json`. Todo `em` é em segundos do BRUTO (o relógio da transcrição);
   `dur` é em segundos do vídeo final.

5b. **Duração e corte de conteúdo.** Meta da Marcela: **até 1:30** cada vídeo.
   Se passar, proponha quais FALAS tirar (frase dispensável, exemplo repetido,
   explicação que não muda o sentido) — mas **nunca quebre o raciocínio**
   ("você está perdendo o sentido dos vídeos"): o gancho, a virada e o CTA
   ficam; humor da Thaís também. Mostre o roteiro com o que sai ANTES de
   aplicar e espere o ok.

5c. **Zoom com parcimônia.** A Marcela achou "muito corte de tela, de aproximar
   e sair". Zoom só em começo de frase, no mínimo a cada 5 s (autoridade,
   1,00/1,08, ênfase 1,16) ou 7 s (amiga, 1,00/1,05) — nunca a cada emenda.

6. **B-roll e imagens.** **Primeiro as fotos da própria Thaís** (`_banco-thais/jpg/`, fora
   do git; se a pasta não existir, peça o link do Drive de fotos e rode `npm run fotos -- <link>`): academia,
   antes/depois, pilates/meditação, notebook, lifestyle — sempre que fizer
   sentido com a fala. Depois, ordem de preferência:
   (a) arquivos que a Thais/Marcela mandaram — em `projetos/<nome>/broll/`;
   (b) gerar com o MCP de imagem/vídeo disponível na sessão (Higgsfield, Canva…);
   (c) banco de imagens com licença;
   (d) Pinterest — liberado pela Marcela com estas regras: **pessoas reais**
   (rostos e corpos de verdade; nada de ilustração ou imagem de IA), **nada do
   Brasil** (busque em inglês), sem celebridade, sem texto/marca d'água/logo
   em destaque. Imagem de IA se denuncia pelo tamanho: PNG em 1024×1536,
   832×1248, 768×1376, 1344×768, 1408×768 etc. — prefira JPG com tamanho de
   câmera/celular (1080×1920, 1200×1500, 4284×5712…). Como buscar: na aba do
   Pinterest logada, a página aceita `fetch('/resource/BaseSearchResource/get/…')`
   e devolve as URLs `i.pinimg.com/originals/…`; monte uma folha de contato
   (composição `Folha`) com as miniaturas 236x e escolha olhando.
   Nunca baixe clipes de outros criadores (TikTok/Reels de terceiros) sem
   autorização. Se faltar B-roll, liste o que precisa (cena + duração) e
   pergunte, em vez de inventar arquivo.
   Adesivos do estilo amiga são PNG com fundo transparente.

7. **Conferir frames — obrigatório.** Você não assiste vídeo; você confere
   frames. `npm run snap -- <nome> auto` e também os segundos críticos (gancho,
   cada B-roll, cada efeito) — os tempos do snap são do vídeo FINAL. Abra
   `projetos/<nome>/snaps/folha.jpg` e passe o checklist do estilo. Corrija e
   repita. Para ver ao vivo: `npm run studio -- <nome>`.

8. **Renderizar.** `npm run render -- <nome> --rapido` (meia resolução) para a
   pessoa revisar; depois `npm run render -- <nome>` para o final. Saída em
   `projetos/<nome>/saida/`.

9. **Entregar.** Caminho do MP4, duração, o que foi cortado, lista de B-roll
   usado e qualquer pendência (ex.: "o B-roll do minuto 1:10 é provisório").

## Regras que valem para os três estilos

- **Legenda é palavra da Thais, não resumo.** Ela segue a fala palavra por
  palavra. Corrigir grafia sim; reescrever não.
- **O rosto manda.** Nada cobre o rosto da Thais por mais de 1 s, exceto
  B-roll em tela cheia (que é intencional e curto: 2–5 s).
- **Corte seco é o padrão.** Transição com efeito só onde a referência do
  estilo manda (flash no `prova`, fade curto da caixa no `amiga`).
- **Ritmo mínimo:** algo muda na tela (corte com zoom, B-roll, legenda nova,
  efeito) pelo menos a cada 4 s no `autoridade`/`prova` e a cada 8 s no
  `amiga`. Mais de 10 s sem nenhuma camada nova = acrescente B-roll ou zoom.
- **Primeiros 3 s decidem.** O gancho sempre tem título/B-roll; nunca abre
  com a Thais parada sem nada na tela.
- **Determinismo.** Não coloque nada aleatório no código: o mesmo plano tem
  que gerar o mesmo vídeo sempre (é isso que permite revisar por frames).
- **Música** é opcional (`plano.musica`, volume ≤ 0,15). Sem arquivo
  licenciado, deixe sem música e avise.

## Onde mexer quando a pessoa pedir mudança

| Pedido | Onde |
|---|---|
| "tira essa frase", "corta o começo" | `plano.cortes` |
| "a legenda escreveu errado" | `plano.legendas[i].texto` |
| "destaca essa palavra" | `*palavra*` no `texto` |
| "põe um B-roll aqui" | `plano.broll` |
| "zoom nessa parte" | `plano.zoom` (`zoomAuto: false` desliga o automático) |
| "o rosto ficou cortado na tela dividida" | `plano.rostoY` (0 = topo, 1 = base; padrão 0,32 — a Thais grava com o rosto em ~0,40) |
| "a legenda está em cima da boca" | `plano.legendaY` (autoridade da Thais: 0,66, no peito) |
| "o título está em cima do rosto" | `plano.titulo.y` (sem B-roll no gancho: ~0,17 autoridade, ~0,12 amiga) |
| "a fonte/cor da legenda de TODOS os vídeos" | `src/estilos/index.ts` — muda o estilo da casa; confirme antes |

Mudar `src/` muda TODOS os vídeos futuros do estilo; mudar `plano.json` muda
só aquele vídeo. Na dúvida, mude o plano.

## Mapa do repositório

```
SKILL.md                     este arquivo
references/
  estilo-autoridade.md       estilo 2 — regras e checklist
  estilo-amiga.md            estilo 3 — regras e checklist
  estilo-prova.md            estilo 1 — regras e checklist
  plano.md                   todos os campos do plano.json com exemplos
src/                         o motor (Remotion + React)
  estilos/index.ts           fontes, cores, tamanhos, posições de cada estilo
  Video.tsx                  ordem das camadas
  componentes/               A-roll, legendas, B-roll, adesivos, efeitos, títulos
scripts/                     novo, transcrever, cortes, snap, render, studio, demo
projetos/<nome>/             um vídeo: plano.json (no git) + mídia (fora do git)
```

`npm run demo -- <estilo>` gera um projeto de exemplo completo sem precisar de
gravação — o `plano.json` dele é o melhor modelo para copiar.
