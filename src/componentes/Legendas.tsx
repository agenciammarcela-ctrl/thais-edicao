/* Legendas palavra a palavra.
   - modo "curta" (estilos 1 e 2): blocos de 1–3 palavras que trocam no ritmo da fala.
   - modo "frase" (estilo 3): a frase se acumula palavra por palavra e fica na tela.
   `*palavra*` no plano = destaque (sublinhado no estilo 3, cor no 1 e 2). */
import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Palavra, Trecho } from '../plano';
import { palavraMantida, paraFinal } from '../plano';
import type { TokensLegenda } from '../estilos';

type P = { texto: string; destaque: boolean; ini: number; fim: number };
type Bloco = { palavras: P[]; ini: number; fim: number };

const limpa = (s: string) => s.replace(/\*/g, '').trim();
const fimDeFrase = (s: string) => /[.!?…:]["”]?$/.test(s);

const caixa = (s: string, minusculas: boolean) => {
  if (!minusculas) return s;
  const semPont = s.replace(/[^\p{L}]/gu, '');
  if (semPont.length > 1 && semPont === semPont.toUpperCase()) return s; // "TUDO" fica gritado
  return s.toLowerCase();
};

export const montarBlocos = (palavras: Palavra[], ts: Trecho[], tk: TokensLegenda): Bloco[] => {
  const ps: P[] = palavras
    .filter((p) => limpa(p.texto) && palavraMantida(ts, p))
    .map((p) => ({
      texto: caixa(limpa(p.texto), tk.minusculas),
      destaque: /\*/.test(p.texto),
      ini: paraFinal(ts, Math.max(p.t, p.f - 0.4)),
      fim: paraFinal(ts, p.f),
    }));

  const blocos: Bloco[] = [];
  let atual: P[] = [];
  const fecha = () => {
    if (atual.length) blocos.push({ palavras: atual, ini: atual[0].ini, fim: atual[atual.length - 1].fim });
    atual = [];
  };
  ps.forEach((p, i) => {
    const chars = atual.map((x) => x.texto).join(' ').length;
    const pausa = atual.length ? p.ini - atual[atual.length - 1].fim : 0;
    const maxPalavras = tk.modo === 'curta' ? 3 : 99;
    if (atual.length && (chars + 1 + p.texto.length > tk.maxChars || pausa > 0.6 || atual.length >= maxPalavras)) fecha();
    atual.push(p);
    if (fimDeFrase(p.texto) || (tk.modo === 'curta' && /,$/.test(p.texto))) fecha();
    if (i === ps.length - 1) fecha();
  });
  // cada bloco vai até o começo do próximo (sem buracos curtos), no máx. +0.8s depois da última palavra
  blocos.forEach((b, i) => {
    const prox = blocos[i + 1];
    b.fim = prox ? Math.min(prox.ini, b.fim + 0.8) : b.fim + 0.6;
  });
  return blocos;
};

type Props = { blocos: Bloco[]; tk: TokensLegenda; y?: number; escala?: number; oculto?: boolean };

export const Legendas: React.FC<Props> = ({ blocos, tk, y, escala = 1, oculto }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  if (oculto) return null;
  const b = blocos.find((x) => t >= x.ini && t < x.fim);
  if (!b) return null;

  const fBloco = (t - b.ini) * fps;
  const fFim = (b.fim - t) * fps;
  const op = Math.min(interpolate(fBloco, [0, 3], [0, 1], { extrapolateRight: 'clamp' }), tk.modo === 'frase' ? interpolate(fFim, [0, 5], [0, 1], { extrapolateRight: 'clamp' }) : 1);
  const pop = tk.modo === 'curta' ? interpolate(fBloco, [0, 4], [0.9, 1], { extrapolateRight: 'clamp' }) : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: (y ?? tk.y) * height,
        width: tk.largura,
        transform: `translate(-50%, -50%) scale(${pop * escala})`,
        // frase que se acumula lê melhor alinhada à esquerda (efeito máquina de escrever)
        textAlign: tk.modo === 'frase' ? 'left' : 'center',
        fontFamily: tk.fonte,
        fontWeight: tk.peso,
        fontStyle: tk.italico ? 'italic' : 'normal',
        fontSize: tk.tamanho,
        lineHeight: 1.08,
        color: tk.cor,
        textShadow: tk.sombra,
        opacity: op,
        letterSpacing: tk.modo === 'frase' ? '0.005em' : '-0.005em',
      }}
    >
      {b.palavras.map((p, i) => {
        const visivel = tk.modo === 'curta' || t >= p.ini - 0.04;
        const estiloDestaque: React.CSSProperties = p.destaque
          ? tk.destaque === 'sublinhado'
            ? { textDecoration: 'underline', textDecorationThickness: 3, textUnderlineOffset: 8 }
            : tk.destaque === 'cor'
              ? { color: tk.corDestaque, fontWeight: Math.min(900, tk.peso + 200) }
              : {}
          : {};
        return (
          <span key={i} style={{ opacity: visivel ? 1 : 0, ...estiloDestaque }}>
            {p.texto}
            {i < b.palavras.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};
