/* Camadas visuais por cima do A-roll: B-roll, adesivos (scrapbook) e efeitos. */
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Img, OffthreadVideo, continueRender, delayRender, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Adesivo, BRoll as TBRoll, Efeito } from '../plano';
import { arquivo, ehVideo, envelope, rnd } from './util';

/* ---------------- B-ROLL ---------------- */
/* topo = meia tela de cima (o A-roll desce para a metade de baixo)
   tela-cheia = cobre tudo, a voz continua
   caixa = faixa no terço de cima, a Thais continua inteira embaixo (estilo 3) */
export const BRoll: React.FC<{ b: TBRoll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dur = Math.round(b.dur * fps);
  const area =
    b.layout === 'topo'
      ? { top: 0, height: height / 2 }
      : b.layout === 'caixa'
        ? { top: 0, height: Math.round(height * 0.33) }
        : { top: 0, height };
  const kb = interpolate(frame, [0, dur], [1.0, 1.08]); // Ken Burns leve só em foto
  const op = b.layout === 'caixa' ? envelope(frame, dur, 4, 4) : 1; // estilos 1 e 2 = corte seco
  const foco = `50% ${(b.focoY ?? 0.4) * 100}%`;
  const estilo: React.CSSProperties = { width, height: area.height, objectFit: 'cover', objectPosition: foco };
  return (
    <div style={{ position: 'absolute', left: 0, width, overflow: 'hidden', opacity: op, ...area }}>
      {ehVideo(b.arquivo) ? (
        <OffthreadVideo src={arquivo(b.arquivo)} muted trimBefore={Math.round((b.inicio ?? 0) * fps)} style={estilo} />
      ) : (
        <Img src={arquivo(b.arquivo)} style={{ ...estilo, transform: `scale(${kb})`, transformOrigin: foco }} />
      )}
    </div>
  );
};

/* ---------------- ADESIVOS (estilo 3) ---------------- */
/* Recorte automático: sticker de Pinterest quase sempre vem em JPG com fundo liso.
   Apaga a cor do fundo (lida nos cantos) CONECTADA À BORDA (flood fill) — o branco de dentro do bicho
   fica. Feito uma vez por arquivo, num canvas, antes do primeiro frame. */
const cacheRecorte = new Map<string, string>();
const useRecorte = (src: string, ativo: boolean) => {
  const [url, setUrl] = useState<string | null>(ativo ? cacheRecorte.get(src) ?? null : src);
  const [h] = useState(() => (ativo && !cacheRecorte.has(src) ? delayRender(`recortando ${src}`) : null));
  useEffect(() => {
    if (!ativo || h === null) return;
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 800 / Math.max(img.width, img.height));
      const w = Math.round(img.width * s), alt = Math.round(img.height * s);
      const c = document.createElement('canvas');
      c.width = w; c.height = alt;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, alt);
      const dados = ctx.getImageData(0, 0, w, alt);
      const px = dados.data;
      // cor do fundo = média dos 4 cantos (branco, cinza claro, bege… qualquer fundo liso)
      const cantos = [0, w - 1, (alt - 1) * w, alt * w - 1];
      const fundo = [0, 1, 2].map((c) => cantos.reduce((s, k) => s + px[k * 4 + c], 0) / 4);
      const claro = (k: number) => {
        const dr = px[k * 4] - fundo[0], dg = px[k * 4 + 1] - fundo[1], db = px[k * 4 + 2] - fundo[2];
        return dr * dr + dg * dg + db * db < 34 * 34;
      };
      const visto = new Uint8Array(w * alt);
      const fila = new Int32Array(w * alt);
      let ini = 0, fim = 0;
      const tenta = (x: number, y: number) => {
        const k = y * w + x;
        if (visto[k]) return;
        visto[k] = 1;
        if (claro(k)) fila[fim++] = k;
      };
      for (let x = 0; x < w; x++) { tenta(x, 0); tenta(x, alt - 1); }
      for (let y = 0; y < alt; y++) { tenta(0, y); tenta(w - 1, y); }
      while (ini < fim) {
        const k = fila[ini++];
        px[k * 4 + 3] = 0;
        const x = k % w, y = (k - x) / w;
        if (x > 0) tenta(x - 1, y);
        if (x < w - 1) tenta(x + 1, y);
        if (y > 0) tenta(x, y - 1);
        if (y < alt - 1) tenta(x, y + 1);
      }
      // borda suave: pixel claro encostado no fundo apagado fica meio transparente
      for (let y = 1; y < alt - 1; y++) for (let x = 1; x < w - 1; x++) {
        const k = y * w + x;
        if (px[k * 4 + 3] === 0) continue;
        const vizinhoApagado = px[(k - 1) * 4 + 3] === 0 || px[(k + 1) * 4 + 3] === 0 || px[(k - w) * 4 + 3] === 0 || px[(k + w) * 4 + 3] === 0;
        if (vizinhoApagado && Math.min(px[k * 4], px[k * 4 + 1], px[k * 4 + 2]) > 190) px[k * 4 + 3] = 110;
      }
      ctx.putImageData(dados, 0, 0);
      const out = c.toDataURL('image/png');
      cacheRecorte.set(src, out);
      setUrl(out);
      continueRender(h);
    };
    img.onerror = () => { setUrl(src); continueRender(h); };
    img.src = src;
  }, [src, ativo, h]);
  return url;
};

/* PNG recortado que "estoura" com mola, flutua de leve e some encolhendo. */
export const AdesivoC: React.FC<{ a: Adesivo; i: number }> = ({ a, i }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const url = useRecorte(arquivo(a.arquivo), a.recorte ?? false);
  const dur = Math.round(a.dur * fps);
  const atraso = i * 2; // cada adesivo entra 2 frames depois do anterior
  const entra = spring({ frame: frame - atraso, fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });
  const sai = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flutua = Math.sin((frame + i * 20) / 14) * 6;
  const gira = (a.rot ?? 0) + Math.sin((frame + i * 9) / 22) * 2;
  const w = a.larg * width;
  const contorno = a.contorno ?? a.recorte ?? false;
  const borda = contorno
    ? 'drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) '
    : '';
  if (!url) return null;
  return (
    <Img
      src={url}
      style={{
        position: 'absolute',
        width: w,
        left: a.x * width - w / 2,
        top: a.y * height - w / 2 + flutua,
        transform: `scale(${entra * sai}) rotate(${gira}deg)`,
        filter: `${borda}drop-shadow(0 8px 12px rgba(0,0,0,.28))`,
      }}
    />
  );
};

/* ---------------- EFEITOS ---------------- */
export const EfeitoC: React.FC<{ e: Efeito }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dur = Math.round((('dur' in e && e.dur) || 0.35) * fps);

  if (e.tipo === 'flash') {
    const op = interpolate(frame, [0, dur * 0.35, dur], [0, 1, 0], { extrapolateRight: 'clamp' });
    return <AbsoluteFill style={{ background: '#fff', opacity: op }} />;
  }

  if (e.tipo === 'sobreposicao') {
    // dupla exposição: imagem/vídeo em modo "screen", grande e translúcido
    const op = envelope(frame, dur, 12, 12) * (e.opacidade ?? 0.55);
    const esc = interpolate(frame, [0, dur], [1.05, 1.18]);
    const estilo: React.CSSProperties = { width, height, objectFit: 'cover', transform: `scale(${esc})` };
    return (
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: op }}>
        {ehVideo(e.arquivo) ? <OffthreadVideo src={arquivo(e.arquivo)} muted style={estilo} /> : <Img src={arquivo(e.arquivo)} style={estilo} />}
      </AbsoluteFill>
    );
  }

  if (e.tipo === 'luz') {
    // vazamento de luz procedural (não precisa de arquivo)
    const cores = { quente: ['255,170,90', '255,120,60'], rosa: ['255,150,190', '255,200,150'], dourada: ['255,215,120', '255,170,70'] }[e.cor ?? 'quente'];
    const p = frame / Math.max(1, dur);
    const op = envelope(frame, dur, 14, 14) * 0.85;
    const x1 = interpolate(p, [0, 1], [-10, 70]);
    const x2 = interpolate(p, [0, 1], [110, 30]);
    return (
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: op,
          background: `radial-gradient(60% 45% at ${x1}% 30%, rgba(${cores[0]},.75), transparent 70%),
                       radial-gradient(50% 60% at ${x2}% 70%, rgba(${cores[1]},.55), transparent 70%),
                       linear-gradient(${110 + p * 40}deg, transparent 30%, rgba(255,240,210,.35) 50%, transparent 70%)`,
        }}
      />
    );
  }

  // brilho: partículas douradas que sobem e se espalham (determinístico)
  const N = 70;
  const op = envelope(frame, dur, 6, 14);
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: op }}>
      {Array.from({ length: N }).map((_, i) => {
        const vida = (frame / dur) * (0.6 + rnd(i) * 0.8);
        const x = (0.2 + rnd(i + 1) * 0.6) * width + Math.sin(frame / 9 + i) * 18 + (rnd(i + 2) - 0.5) * vida * 500;
        const y = (0.35 + rnd(i + 3) * 0.4) * height - vida * (260 + rnd(i + 4) * 420);
        const s = 4 + rnd(i + 5) * 10;
        const pisca = 0.5 + 0.5 * Math.sin(frame / 3 + i * 1.7);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: '50%',
              background: 'rgb(255,214,120)',
              boxShadow: `0 0 ${s * 2.5}px rgba(255,190,80,.9)`,
              opacity: pisca,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
