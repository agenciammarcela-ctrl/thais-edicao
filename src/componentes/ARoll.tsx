/* A-roll: a Thais falando. Monta os trechos mantidos (cortes), aplica o zoom
   alternado a cada corte (punch-in), o respiro lento e, quando há B-roll
   "topo", empurra o rosto para a metade de baixo da tela. */
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Trecho, Zoom } from '../plano';
import { paraFinal } from '../plano';
import { arquivo } from './util';
import { VideoRecortado } from './Pessoa';

type Props = {
  video: string;
  ts: Trecho[];
  zoomAlternado: number;
  zoomAuto: boolean;
  zoom: Zoom[];
  respiro: number;
  rostoY: number;
  dividido: boolean;
  filtro: string;
  extraFiltro?: string;
  /** desenha só a pessoa (fundo transparente) — usado por cima do B-roll */
  soPessoa?: boolean;
};

export const ARoll: React.FC<Props> = ({ video, ts, zoomAlternado, zoomAuto, zoom, respiro, rostoY, dividido, filtro, extraFiltro, soPessoa }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  // em qual trecho estamos? (para o zoom alternado)
  let idx = 0;
  for (let i = 0; i < ts.length; i++) if (t >= ts[i].inicioFinal) idx = i;

  // zoom manual (do plano) tem prioridade; senão alterna 1 / zoomAlternado a cada corte
  const manuais = zoom
    .map((z) => ({ em: paraFinal(ts, z.em), escala: z.escala }))
    .sort((a, b) => a.em - b.em)
    .filter((z) => z.em <= t);
  let escala = zoomAuto && zoomAlternado > 1 ? (idx % 2 === 1 ? zoomAlternado : 1) : 1;
  if (manuais.length) {
    const ult = manuais[manuais.length - 1];
    if (!zoomAuto || ult.em >= (ts[idx]?.inicioFinal ?? 0)) escala = ult.escala;
  }
  escala *= 1 + respiro * (frame / Math.max(1, durationInFrames));

  // meia tela de baixo: o rosto fica a ~40% da caixa de baixo
  const meia = height / 2;
  const desloc = dividido ? Math.min(meia, Math.max(0, rostoY * height - meia * 0.4)) : 0;

  return (
    <AbsoluteFill style={dividido ? { top: meia, height: meia, overflow: 'hidden' } : { overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: -desloc,
          width,
          height,
          transform: `scale(${escala})`,
          transformOrigin: `50% ${rostoY * 100}%`,
          filter: [filtro, extraFiltro].filter(Boolean).join(' '),
        }}
      >
        {ts.map((tr, i) => {
          // bordas arredondadas de forma cumulativa: nenhum frame fica sem vídeo entre trechos
          const de = Math.round(tr.inicioFinal * fps);
          const ate = i === ts.length - 1 ? durationInFrames : Math.round((tr.inicioFinal + (tr.b - tr.a) / tr.v) * fps);
          return (
          <Sequence key={i} from={de} durationInFrames={Math.max(1, ate - de)} layout="none">
            {soPessoa ? (
              <VideoRecortado src={arquivo(video)} trimBefore={Math.round(tr.a * fps)} playbackRate={tr.v} width={width} height={height} />
            ) : (
              <OffthreadVideo
                src={arquivo(video)}
                trimBefore={Math.round(tr.a * fps)}
                playbackRate={tr.v}
                preservePitch
                style={{ width, height, objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
            )}
          </Sequence>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
