/* Gráficos de texto: título do gancho, cartela de capítulo e provas (manchete/prints). */
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Estilo, Prova, Titulo as TTitulo } from '../plano';
import type { Tokens } from '../estilos';
import { arquivo, envelope, rnd } from './util';

/* título curto ("5 CONSELHOS") fica no tamanho cheio; título longo encolhe e quebra em 2 linhas */
const tamanhoTitulo = (texto: string, max: number) => (texto.length <= 12 ? max : Math.max(84, Math.round((max * 12) / texto.length)));

/* ---------------- TÍTULO DO GANCHO ---------------- */
/* autoridade: faixa vermelha estilo thumbnail de YouTube, na linha da divisão
   amiga: título grande arredondado com estrelas douradas (scrapbook)
   prova: faixa amarela com texto preto */
export const Titulo: React.FC<{ t: TTitulo; estilo: Estilo; tk: Tokens; dur: number }> = ({ t, estilo, tk, dur }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const op = envelope(frame, dur, 3, 5);
  const y = t.y ?? tk.titulo.y;

  if (estilo === 'amiga') {
    const n = t.estrelas ?? 0;
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: y * height, transform: `translateY(-50%) scale(${0.8 + 0.2 * pop})`, opacity: op, textAlign: 'center' }}>
        {n > 0 && (
          <div style={{ fontSize: 62, letterSpacing: 6, color: '#F5C542', textShadow: '0 2px 6px rgba(120,70,0,.35)', marginBottom: 4 }}>
            {Array.from({ length: n }).map((_, i) => (
              <span key={i} style={{ display: 'inline-block', transform: `scale(${spring({ frame: frame - 4 - i * 3, fps, config: { damping: 9 } })})` }}>
                ★
              </span>
            ))}
          </div>
        )}
        <div style={{ fontFamily: tk.titulo.fonte, fontWeight: tk.titulo.peso, fontSize: tamanhoTitulo(t.texto, tk.titulo.tamanho), color: tk.titulo.cor, lineHeight: 0.98, letterSpacing: '-0.01em', textShadow: '0 4px 18px rgba(0,0,0,.28)', maxWidth: 980, margin: '0 auto', textWrap: 'balance' }}>
          {t.texto}
        </div>
        {t.sub && (
          <div style={{ fontFamily: tk.legenda.fonte, fontStyle: 'italic', fontSize: 40, color: tk.legenda.cor, marginTop: 14, textShadow: tk.legenda.sombra }}>{t.sub}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', left: '50%', top: y * height, transform: `translate(-50%,-50%) scale(${0.92 + 0.08 * pop})`, opacity: op, width: 960, textAlign: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          background: tk.titulo.fundo,
          color: tk.titulo.cor,
          fontFamily: tk.titulo.fonte,
          fontWeight: tk.titulo.peso,
          fontSize: tk.titulo.tamanho,
          lineHeight: 1.12,
          padding: '14px 30px 16px',
          maxWidth: 960,
          letterSpacing: '-0.01em',
          textWrap: 'balance',
        }}
      >
        {t.texto}
      </span>
    </div>
  );
};

/* ---------------- CARTELA DE CAPÍTULO (estilo prova) ---------------- */
/* fundo escuro com brilho; frase pequena + palavra-chave grande itálica dourada
   que entra com desfoque. */
export const Cartela: React.FC<{ pre?: string; destaque: string; tk: Tokens; dur: number }> = ({ pre, destaque, tk, dur }) => {
  const frame = useCurrentFrame();
  const c = tk.cartela!;
  const op = envelope(frame, dur, 4, 6);
  const linha = (atraso: number) => ({
    opacity: interpolate(frame - atraso, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    filter: `blur(${interpolate(frame - atraso, [0, 10], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
  });
  const palavras = destaque.split(' ');
  return (
    <AbsoluteFill style={{ background: `radial-gradient(55% 35% at 50% 47%, ${c.brilho}, transparent 70%), ${c.fundo}`, opacity: op, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 90 }}>
      {pre && <div style={{ fontFamily: c.fontePre, fontSize: 50, color: c.pre, marginBottom: 6, ...linha(0) }}>{pre}</div>}
      <div style={{ fontFamily: c.fonteDestaque, fontStyle: 'italic', fontWeight: 800, fontSize: 124, lineHeight: 1.02, color: c.destaque, textShadow: `0 0 28px ${c.destaque}88, 0 0 70px ${c.destaque}44` }}>
        {palavras.map((p, i) => (
          <span key={i} style={{ display: 'inline-block', marginRight: 24, ...linha(6 + i * 5) }}>
            {p}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- PROVA (estilo prova) ---------------- */
/* manchete: fundo P&B desfocado (via A-roll) + caixa branca com a manchete em serifa preta.
   print: prints empilhando com leve rotação. */
export const ProvaC: React.FC<{ p: Prova; tk: Tokens; dur: number }> = ({ p, tk, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = envelope(frame, dur, 4, 5);
  // o P&B + desfoque do fundo é aplicado no próprio A-roll (Video.tsx → extraFiltro)
  const fundo: React.CSSProperties = { background: 'rgba(0,0,0,.18)' };

  if (p.tipo === 'manchete') {
    const pop = spring({ frame, fps, config: { damping: 15 } });
    return (
      <AbsoluteFill style={{ ...fundo, opacity: op, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', padding: '26px 30px', width: 640, transform: `scale(${0.9 + 0.1 * pop})`, boxShadow: '0 20px 50px rgba(0,0,0,.35)' }}>
          <div style={{ fontFamily: tk.manchete?.fonte, fontWeight: 600, fontSize: 58, lineHeight: 1.05, color: '#111' }}>{p.texto}</div>
          {p.fonte && <div style={{ fontFamily: 'sans-serif', fontSize: 24, color: '#666', marginTop: 14 }}>{p.fonte}</div>}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ ...fundo, opacity: op }}>
      {p.arquivos.map((a, i) => {
        const s = spring({ frame: frame - i * 3, fps, config: { damping: 13, stiffness: 200 } });
        return (
          <Img
            key={i}
            src={arquivo(a)}
            style={{
              position: 'absolute',
              width: 560,
              left: 260 + (rnd(i) - 0.5) * 420,
              top: 260 + (i * 1400) / Math.max(1, p.arquivos.length) + (rnd(i + 7) - 0.5) * 120,
              transform: `scale(${s}) rotate(${(rnd(i + 3) - 0.5) * 8}deg)`,
              boxShadow: '0 14px 34px rgba(0,0,0,.35)',
              borderRadius: 10,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
