/* Recorte da Thais (pessoa na frente do B-roll).
   Usa o segmentador "selfie multiclass" do MediaPipe (Google): separa cabelo, rosto,
   corpo e roupa do fundo, quadro a quadro, dentro do próprio render. O resultado é
   o mesmo frame do A-roll só com a pessoa — desenhado POR CIMA do B-roll, então a
   imagem fica atrás dela e a cabeça nunca é cortada.
   Precisa de internet no render (baixa o modelo ~16 MB uma vez por aba). */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OffthreadVideo, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
const MODELO = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

let carregando: Promise<ImageSegmenter> | null = null;
let pronto: ImageSegmenter | null = null;
const carregar = () => {
  if (!carregando) {
    carregando = FilesetResolver.forVisionTasks(WASM)
      .then((fs) =>
        ImageSegmenter.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODELO, delegate: 'CPU' },
          runningMode: 'IMAGE',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        }),
      )
      .then((s) => (pronto = s));
  }
  return carregando;
};

const useSegmentador = () => {
  const [seg, setSeg] = useState<ImageSegmenter | null>(pronto);
  const [h] = useState(() => (pronto ? null : delayRender('carregando recorte de pessoa', { timeoutInMilliseconds: 120000 })));
  useEffect(() => {
    if (pronto) return;
    carregar().then((s) => {
      setSeg(s);
      if (h !== null) continueRender(h);
    });
  }, [h]);
  return seg;
};

type Props = { src: string; trimBefore: number; playbackRate: number; width: number; height: number };

/** Um trecho do A-roll desenhado só com a pessoa (fundo transparente). */
export const VideoRecortado: React.FC<Props> = ({ src, trimBefore, playbackRate, width, height }) => {
  const seg = useSegmentador();
  const canvas = useRef<HTMLCanvasElement>(null);
  const mascara = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();

  const desenhar = useCallback(
    (img: CanvasImageSource) => {
      const c = canvas.current;
      if (!c || !seg) return;
      const ctx = c.getContext('2d')!;
      const res = seg.segment(img as HTMLImageElement);
      const fundo = res.confidenceMasks?.[0]; // categoria 0 = fundo
      if (!fundo) { res.close(); return; }
      const mw = fundo.width, mh = fundo.height;
      const conf = fundo.getAsFloat32Array();
      if (!mascara.current) mascara.current = document.createElement('canvas');
      const m = mascara.current;
      m.width = mw; m.height = mh;
      const mctx = m.getContext('2d')!;
      const dados = mctx.createImageData(mw, mh);
      for (let i = 0; i < conf.length; i++) {
        // pessoa = 1 - fundo, com curva para endurecer a borda sem serrilhar
        const p = Math.min(1, Math.max(0, (1 - conf[i] - 0.25) / 0.5));
        dados.data[i * 4 + 3] = Math.round(p * 255);
      }
      mctx.putImageData(dados, 0, 0);
      res.close();
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0, width, height);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(m, 0, 0, width, height); // máscara 256×256 ampliada = borda suave
      ctx.globalCompositeOperation = 'source-over';
    },
    [seg, width, height],
  );

  if (!seg) return null;
  return (
    <>
      <OffthreadVideo
        src={src}
        trimBefore={trimBefore}
        playbackRate={playbackRate}
        muted
        onVideoFrame={desenhar}
        style={{ position: 'absolute', inset: 0, width, height, opacity: 0 }}
      />
      <canvas ref={canvas} width={width} height={height} data-frame={frame} style={{ position: 'absolute', inset: 0, width, height }} />
    </>
  );
};
