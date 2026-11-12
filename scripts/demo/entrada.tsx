/* Mídia FALSA para a demonstração (npm run demo). Não faz parte da edição real:
   gera um "bruto" com uma silhueta falando e um relógio do tempo do bruto
   (para conferir os cortes), clipes e fotos de B-roll e um adesivo PNG. */
import React from 'react';
import { AbsoluteFill, Audio, Composition, registerRoot, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const Bruto: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fala = Math.abs(Math.sin(f / 3)) * 18;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg,#8a6a52,#3b2a20)' }}>
      <div style={{ position: 'absolute', left: 340, top: 1020, width: 400, height: 900, borderRadius: '200px 200px 0 0', background: '#1d1714' }} />
      <div style={{ position: 'absolute', left: 390, top: 430, width: 300, height: 380, borderRadius: '50%', background: '#e8b896' }} />
      <div style={{ position: 'absolute', left: 500, top: 700, width: 80, height: 10 + fala, borderRadius: 20, background: '#7a3b33' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', font: 'bold 64px monospace', color: '#fff8' }}>BRUTO {(f / fps).toFixed(1)}s</div>
      <Audio src={staticFile('_cache/voz.wav')} />
    </AbsoluteFill>
  );
};
const Clipe: React.FC<{ cor: string }> = ({ cor }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: cor }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 120 + i * 220 + Math.sin(f / 12 + i) * 60, top: 300 + Math.cos(f / 15 + i) * 200, width: 180, height: 180, borderRadius: '50%', background: '#fff6' }} />
      ))}
      <div style={{ position: 'absolute', bottom: 80, width: '100%', textAlign: 'center', font: 'bold 70px sans-serif', color: '#fff' }}>B-ROLL</div>
    </AbsoluteFill>
  );
};
const Adesivo: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #ffd9e6, #ff7aa2)', border: '14px solid #fff', fontSize: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✿</div>
  </AbsoluteFill>
);
const Root = () => (
  <>
    <Composition id="Bruto" component={Bruto} width={1080} height={1920} fps={30} durationInFrames={30} defaultProps={{ dur: 1 }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.dur * 30) })} />
    <Composition id="Clipe" component={Clipe} width={1080} height={1080} fps={30} durationInFrames={180} defaultProps={{ cor: '#3a7bd5' }} />
    <Composition id="Adesivo" component={Adesivo} width={400} height={400} fps={30} durationInFrames={1} />
  </>
);
registerRoot(Root);
