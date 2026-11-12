/* Folha de contato para conferência (npm run snap). Não aparece no vídeo. */
import React from 'react';
import { AbsoluteFill, Img } from 'remotion';

export type FolhaProps = { imagens: { src: string; rotulo: string }[]; cols: number };
export const LARG = 270;
export const ALT = 480;

export const Folha: React.FC<FolhaProps> = ({ imagens, cols }) => (
  <AbsoluteFill style={{ background: '#111', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 6, alignContent: 'flex-start', width: cols * (LARG + 6) + 6 }}>
    {imagens.map((im, i) => (
      <div key={i} style={{ position: 'relative', width: LARG, height: ALT }}>
        <Img src={im.src} style={{ width: LARG, height: ALT, objectFit: 'cover' }} />
        <span style={{ position: 'absolute', left: 4, top: 4, background: '#000c', color: '#ff0', font: 'bold 20px sans-serif', padding: '0 4px' }}>{im.rotulo}</span>
      </div>
    ))}
  </AbsoluteFill>
);
