/* =========================================================
   TOKENS DOS ESTILOS — fonte, cor, posição e ritmo de cada um.
   Medidas em px num quadro de 1080×1920.
   Valores tirados da análise quadro a quadro das referências
   (references/estilo-*.md explica cada decisão).
   ========================================================= */
import { loadFont as poppins } from '@remotion/google-fonts/Poppins';
import { loadFont as montserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as dmSans } from '@remotion/google-fonts/DMSans';
import { loadFont as fredoka } from '@remotion/google-fonts/Fredoka';
import { loadFont as playfair } from '@remotion/google-fonts/PlayfairDisplay';
import type { Estilo } from '../plano';

const sub = ['latin', 'latin-ext'] as const;
const POPPINS = poppins('normal', { weights: ['500', '600'], subsets: [...sub] }).fontFamily;
const MONTSERRAT = montserrat('normal', { weights: ['700', '800'], subsets: [...sub] }).fontFamily;
const DMSANS_I = dmSans('italic', { weights: ['400', '500'], subsets: [...sub] }).fontFamily;
const DMSANS = dmSans('normal', { weights: ['400', '500'], subsets: [...sub] }).fontFamily;
const FREDOKA = fredoka('normal', { weights: ['600', '700'], subsets: [...sub] }).fontFamily;
const PLAYFAIR = playfair('normal', { weights: ['600'], subsets: [...sub] }).fontFamily;
const PLAYFAIR_I = playfair('italic', { weights: ['800'], subsets: [...sub] }).fontFamily;

export type TokensLegenda = {
  fonte: string;
  peso: number;
  italico: boolean;
  tamanho: number;
  cor: string;
  sombra: string;
  /** centro vertical da legenda, 0–1 da altura */
  y: number;
  /** como as palavras viram blocos */
  modo: 'curta' | 'frase';
  /** máximo de caracteres por bloco (modo curta) ou por frase (modo frase) */
  maxChars: number;
  minusculas: boolean;
  largura: number;
  destaque: 'sublinhado' | 'cor' | 'nenhum';
  corDestaque: string;
};

export type Tokens = {
  nome: string;
  legenda: TokensLegenda;
  /** escala do zoom alternado a cada corte (1 = sem zoom) */
  zoomAlternado: number;
  /** empurrão lento contínuo da câmera durante o vídeo todo */
  respiro: number;
  titulo: { fonte: string; cor: string; fundo: string; tamanho: number; y: number; peso: number };
  cartela?: { fundo: string; brilho: string; pre: string; destaque: string; fontePre: string; fonteDestaque: string };
  manchete?: { fonte: string };
  /** cor geral: filtro CSS aplicado no A-roll */
  cor: string;
};

export const ESTILOS: Record<Estilo, Tokens> = {
  /* ESTILO 2 — documentário de autoridade (ref.: @dra.lilianalimongi) */
  autoridade: {
    nome: 'Autoridade',
    legenda: {
      fonte: POPPINS,
      peso: 500,
      italico: false,
      tamanho: 56,
      cor: '#F3E4C8',
      sombra: '0 2px 10px rgba(0,0,0,.55), 0 0 2px rgba(0,0,0,.6)',
      y: 0.5,
      modo: 'curta',
      maxChars: 16,
      minusculas: false,
      largura: 860,
      destaque: 'cor',
      corDestaque: '#FFFFFF',
    },
    zoomAlternado: 1.14,
    respiro: 0,
    titulo: { fonte: MONTSERRAT, cor: '#FFFFFF', fundo: '#C8191E', tamanho: 58, y: 0.5, peso: 800 },
    cor: 'saturate(1.05) contrast(1.04) sepia(.06)',
  },

  /* ESTILO 3 — amiga terapeuta / scrapbook (ref.: @larissalodisalum) */
  amiga: {
    nome: 'Amiga',
    legenda: {
      fonte: DMSANS_I,
      peso: 400,
      italico: true,
      tamanho: 50,
      cor: '#F8E9A9',
      sombra: '0 1px 6px rgba(60,30,0,.35)',
      y: 0.22,
      modo: 'frase',
      maxChars: 70,
      minusculas: true,
      largura: 660,
      destaque: 'sublinhado',
      corDestaque: '#F8E9A9',
    },
    zoomAlternado: 1,
    respiro: 0.04,
    titulo: { fonte: FREDOKA, cor: '#FFFFFF', fundo: 'transparent', tamanho: 132, y: 0.2, peso: 700 },
    cor: 'saturate(1.02) contrast(.96) brightness(1.03) sepia(.08)',
  },

  /* ESTILO 1 — análise com prova (ref.: @elias.maman / @leticiavaz) */
  prova: {
    nome: 'Prova',
    legenda: {
      fonte: PLAYFAIR,
      peso: 600,
      italico: false,
      tamanho: 54,
      cor: '#E8B84A',
      sombra: '0 2px 10px rgba(0,0,0,.6)',
      y: 0.5,
      modo: 'curta',
      maxChars: 18,
      minusculas: false,
      largura: 880,
      destaque: 'cor',
      corDestaque: '#FFD66B',
    },
    zoomAlternado: 1.18,
    respiro: 0,
    titulo: { fonte: MONTSERRAT, cor: '#111', fundo: '#F2C230', tamanho: 58, y: 0.5, peso: 800 },
    cartela: {
      fundo: '#0B1210',
      brilho: 'rgba(232,184,74,.18)',
      pre: '#EDE6D2',
      destaque: '#F2C94C',
      fontePre: DMSANS,
      fonteDestaque: PLAYFAIR_I,
    },
    manchete: { fonte: PLAYFAIR },
    cor: 'contrast(1.1) saturate(.95)',
  },
};
