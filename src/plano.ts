/* =========================================================
   O PLANO DE EDIÇÃO (projetos/<nome>/plano.json)

   É o único arquivo que o Claude (ou você) edita para mudar o vídeo.
   Regra de ouro: TODO tempo "em" é em segundos do VÍDEO BRUTO — o mesmo
   relógio da transcrição. O renderizador converte para o tempo do vídeo
   final depois dos cortes. Assim, mexer nos cortes nunca desalinha
   legenda, B-roll ou efeito.
   ========================================================= */

export type Estilo = 'autoridade' | 'amiga' | 'prova';

/** Uma palavra falada, com tempo do bruto. `*palavra*` = destaque. */
export type Palavra = { t: number; f: number; texto: string };

export type Zoom = { em: number; escala: number };

export type Titulo = {
  /** Estilo autoridade: faixa vermelha de "thumbnail". Estilo amiga: título grande com estrelas. */
  texto: string;
  sub?: string;
  /** até quando fica na tela (tempo do bruto) */
  ate: number;
  estrelas?: number;
  /** centro vertical do título (0–1); sobrescreve o padrão do estilo */
  y?: number;
};

export type BRoll = {
  arquivo: string; // relativo à pasta do projeto: broll/x.mp4 ou broll/x.jpg
  em: number;
  /** duração em segundos do vídeo FINAL */
  dur: number;
  /** topo = meia tela em cima (estilos 1 e 2); tela-cheia; caixa = faixa no terço de cima (estilo 3) */
  layout: 'topo' | 'tela-cheia' | 'caixa';
  /** segundo do clipe de B-roll em que começa */
  inicio?: number;
  /** foco vertical da imagem do B-roll (0 = topo, 1 = base) */
  focoY?: number;
};

export type Adesivo = {
  arquivo: string; // PNG com fundo transparente
  em: number;
  dur: number;
  /** posição do centro, 0–1 da largura/altura */
  x: number;
  y: number;
  /** largura, 0–1 da largura do vídeo */
  larg: number;
  rot?: number;
  /** true = apaga o fundo branco/claro a partir das bordas (sticker de Pinterest em JPG) */
  recorte?: boolean;
  /** contorno branco de sticker (padrão: true quando recorte = true) */
  contorno?: boolean;
};

export type Efeito =
  | { tipo: 'sobreposicao'; arquivo: string; em: number; dur: number; opacidade?: number }
  | { tipo: 'luz'; em: number; dur: number; cor?: 'quente' | 'rosa' | 'dourada' }
  | { tipo: 'brilho'; em: number; dur: number }
  | { tipo: 'flash'; em: number; dur?: number };

export type Cartela = {
  em: number;
  dur: number;
  pre?: string;
  destaque: string;
};

export type Prova =
  | { tipo: 'manchete'; em: number; dur: number; texto: string; fonte?: string }
  | { tipo: 'print'; em: number; dur: number; arquivos: string[] };

export type Musica = { arquivo: string; volume?: number; inicio?: number };

export type Plano = {
  estilo: Estilo;
  video: string; // bruto.mp4
  fps?: number;
  /** trechos do bruto que FICAM, em segundos: [[início, fim], ...] */
  cortes: [number, number][];
  legendas: Palavra[];
  /** 0–1: altura do rosto no bruto; usado para enquadrar a meia tela de baixo */
  rostoY?: number;
  /** centro vertical da legenda (0–1) quando a tela NÃO está dividida; sobrescreve o padrão do estilo */
  legendaY?: number;
  /** zoom automático alternado a cada corte (estilos 1 e 2). Default: true */
  zoomAuto?: boolean;
  zoom?: Zoom[];
  titulo?: Titulo;
  broll?: BRoll[];
  adesivos?: Adesivo[];
  efeitos?: Efeito[];
  cartelas?: Cartela[];
  provas?: Prova[];
  musica?: Musica;
  /** velocidade do vídeo final (1 = normal; 1.12 = 12% mais rápido, voz sem ficar fina) */
  velocidade?: number;
  /** B-roll em caixa passa ATRÁS da pessoa (recorte automático). Padrão: true */
  pessoaNaFrente?: boolean;
};

/* ---------- relógio: bruto -> final ---------- */

/** v = velocidade: um trecho de 10 s do bruto dura 10/v s no vídeo final */
export type Trecho = { a: number; b: number; inicioFinal: number; v: number };

export const trechos = (cortes: [number, number][], v = 1): Trecho[] => {
  let acc = 0;
  return [...cortes]
    .sort((x, y) => x[0] - y[0])
    .map(([a, b]) => {
      const t = { a, b, inicioFinal: acc, v };
      acc += (b - a) / v;
      return t;
    });
};

export const duracaoFinal = (cortes: [number, number][], v = 1) =>
  cortes.reduce((s, [a, b]) => s + (b - a), 0) / v;

/** Converte um instante do bruto para o vídeo final. Se cair num trecho cortado,
 *  vai para o início do próximo trecho que ficou. */
export const paraFinal = (ts: Trecho[], tBruto: number): number => {
  for (const tr of ts) {
    if (tBruto < tr.a) return tr.inicioFinal;
    if (tBruto <= tr.b) return tr.inicioFinal + (tBruto - tr.a) / tr.v;
  }
  const u = ts[ts.length - 1];
  return u ? u.inicioFinal + (u.b - u.a) / u.v : 0;
};

/** A palavra sobreviveu aos cortes? Basta um pedaço dela (≥ 0,08 s) estar num trecho
 *  mantido — o whisper costuma "esticar" a palavra por cima da pausa que vem antes dela,
 *  e o meio da palavra pode cair justamente no silêncio cortado. */
export const palavraMantida = (ts: Trecho[], p: Palavra) =>
  ts.some((tr) => Math.min(p.f, tr.b) - Math.max(p.t, tr.a) >= Math.min(0.08, (p.f - p.t) * 0.5));
