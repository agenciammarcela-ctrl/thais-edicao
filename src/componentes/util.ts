import { interpolate, staticFile } from 'remotion';

/** opacidade de entrada/saída: sobe em `ent` frames, desce nos últimos `sai` frames */
export const envelope = (frame: number, dur: number, ent = 6, sai = 6) =>
  interpolate(frame, [0, ent, Math.max(ent + 1, dur - sai), dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const ehVideo = (arquivo: string) => /\.(mp4|mov|webm|m4v)$/i.test(arquivo);

export const arquivo = (caminho: string) => staticFile(caminho.replace(/^\.?\//, ''));

/** pseudo-aleatório determinístico (mesmo resultado em todo render) */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** está ativo agora? (intervalo em frames do vídeo final) */
export const ativo = (frame: number, ini: number, dur: number) => frame >= ini && frame < ini + dur;
