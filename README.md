# Edição Thais

Repositório de edição dos vídeos da Thais. Você entrega o vídeo bruto (ela
falando para a câmera), escolhe o estilo e o Claude devolve o MP4 vertical
editado: cortes de silêncio, legenda palavra a palavra, B-roll, títulos e
efeitos — sempre no padrão da casa.

| Estilo | Para quê | Assinatura |
|---|---|---|
| **Autoridade** (estilo 2) | conteúdo técnico, "o verdadeiro motivo" | faixa vermelha no gancho, tela dividida, B-roll literal, legenda creme discreta, zoom a cada corte |
| **Amiga** (estilo 3) | conselhos, emocional, listas | adesivos scrapbook, título com estrelas, legenda itálica em minúsculas que se acumula, flor em dupla exposição, luz e brilho |
| **Prova** (estilo 1) | análises com dados | manchetes com fundo P&B, cartelas douradas de capítulo, flash, zoom forte |

## Como usar (no Claude Code)

1. Abra esta pasta no Claude Code (app desktop → Code → pasta `thais-edicao`).
2. Peça em português normal, por exemplo:
   > Edita o vídeo ~/Downloads/thais-cansaco.mp4 no estilo autoridade.
   > Os B-rolls estão em ~/Downloads/broll-cansaco.

   > Esse aqui é estilo amiga, são 3 conselhos. Gera os adesivos de flor e café.
3. O Claude cria o projeto, transcreve, corta, monta, confere os frames e
   renderiza. O vídeo sai em `projetos/<nome>/saida/`.
4. Peça ajustes na mesma conversa ("tira a frase do começo", "B-roll mais
   cedo", "destaca a palavra ferro").

As regras que o Claude segue estão em `SKILL.md` e `references/`.

## Instalação (uma vez por computador)

Precisa de Node 20+ ([nodejs.org](https://nodejs.org)) e das ferramentas de
linha de comando da Apple (`xcode-select --install`).

```bash
git clone <url-deste-repositório> thais-edicao
cd thais-edicao
npm install
npm run instalar     # transcrição local (whisper.cpp + modelo, ~1,5 GB)
```

Teste sem gravar nada:

```bash
npm run demo -- amiga
npm run render -- demo-amiga
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run novo -- <nome> <estilo> <bruto.mp4>` | cria `projetos/<nome>/` |
| `npm run transcrever -- <nome>` | transcrição com tempo de cada palavra |
| `npm run cortes -- <nome> [pausa] [limiar]` | corta silêncios detectados no áudio |
| `npm run remover -- <nome> 24.5-32.2 …` | tira frases regravadas e sobras |
| `npm run snap -- <nome> auto` | folha de contato para conferência |
| `npm run studio -- <nome>` | editor visual no navegador (play, agulha, camadas) |
| `npm run render -- <nome> [--rapido]` | MP4 final (ou prévia em meia resolução) |
| `npm run demo -- <estilo>` | projeto de exemplo com mídia falsa |

## O que vai e o que não vai para o GitHub

Vai: código, regras, e o `plano.json` de cada vídeo (a "receita" da edição,
pequena). Não vai: vídeos brutos, B-roll, renders (`.gitignore`). Para a
outra pessoa editar o mesmo vídeo, mande o bruto e a pasta `broll/` por
Drive/WeTransfer e ela coloca em `projetos/<nome>/`.

Fluxo entre vocês duas: antes de começar, `git pull`; ao terminar um vídeo,
peça ao Claude para fazer commit e push do `plano.json`.

## Licenças

- Motor de vídeo: [Remotion](https://www.remotion.dev) — gratuito para
  pessoas físicas e empresas com até 3 funcionários; acima disso exige
  licença paga.
- Fontes: Google Fonts (licença aberta).
- B-roll: use material próprio, gerado ou de banco com licença. Não use
  clipes de outros criadores sem autorização.
