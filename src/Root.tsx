import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import { Video } from './Video';
import type { Plano } from './plano';
import { duracaoFinal } from './plano';
import { ALT, Folha, LARG, type FolhaProps } from './Folha';

/* Plano vazio só para o Studio abrir sem projeto. O plano real chega por
   --props=projetos/<nome>/plano.json (os scripts já fazem isso). */
const vazio: Plano = { estilo: 'autoridade', video: 'bruto.mp4', cortes: [[0, 5]], legendas: [] };

const calcular: CalculateMetadataFunction<Plano> = ({ props }) => {
  const fps = props.fps ?? 30;
  return { fps, durationInFrames: Math.max(1, Math.ceil(duracaoFinal(props.cortes, props.velocidade ?? 1) * fps)) };
};

const calcularFolha: CalculateMetadataFunction<FolhaProps> = ({ props }) => ({
  width: props.cols * (LARG + 6) + 6,
  height: Math.ceil(props.imagens.length / props.cols) * (ALT + 6) + 6,
});

export const Root: React.FC = () => (
  <>
  <Composition
    id="Video"
    component={Video}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={150}
    defaultProps={vazio}
    calculateMetadata={calcular}
  />
  {/* só para o npm run snap */}
  <Composition id="Folha" component={Folha} width={100} height={100} fps={30} durationInFrames={1} defaultProps={{ imagens: [], cols: 6 }} calculateMetadata={calcularFolha} />
  </>
);
