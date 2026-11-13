/* A composição: lê o plano e empilha as camadas na ordem certa.
   A-roll → B-roll → efeitos → adesivos → provas → cartelas → título → legendas → flash */
import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Plano } from './plano';
import { paraFinal, trechos } from './plano';
import { ESTILOS } from './estilos';
import { ARoll } from './componentes/ARoll';
import { Legendas, montarBlocos } from './componentes/Legendas';
import { AdesivoC, BRoll, EfeitoC } from './componentes/Camadas';
import { Cartela, ProvaC, Titulo } from './componentes/Graficos';
import { arquivo, ativo } from './componentes/util';

export const Video: React.FC<Plano> = (plano) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tk = ESTILOS[plano.estilo];
  const ts = useMemo(() => trechos(plano.cortes, plano.velocidade ?? 1), [plano.cortes, plano.velocidade]);
  const F = (tBruto: number) => Math.round(paraFinal(ts, tBruto) * fps);
  const blocos = useMemo(() => montarBlocos(plano.legendas ?? [], ts, tk.legenda), [plano.legendas, ts, tk.legenda]);

  // B-roll nunca se sobrepõe: cada um termina, no máximo, quando o próximo começa
  const broll = (plano.broll ?? [])
    .map((b) => ({ b, ini: F(b.em), dur: Math.round(b.dur * fps) }))
    .sort((x, y) => x.ini - y.ini)
    .map((x, i, arr) => ({ ...x, dur: Math.max(1, Math.min(x.dur, (arr[i + 1]?.ini ?? Infinity) - x.ini)) }));
  const cartelas = (plano.cartelas ?? []).map((c) => ({ c, ini: F(c.em), dur: Math.round(c.dur * fps) }));
  const provas = (plano.provas ?? []).map((p) => ({ p, ini: F(p.em), dur: Math.round(p.dur * fps) }));
  const adesivos = (plano.adesivos ?? []).map((a) => ({ a, ini: F(a.em), dur: Math.round(a.dur * fps) }));
  const efeitos = (plano.efeitos ?? []).map((e) => ({ e, ini: F(e.em), dur: Math.round((('dur' in e && e.dur) || 0.35) * fps) }));
  const titulo = plano.titulo ? { t: plano.titulo, ini: 0, dur: Math.max(1, F(plano.titulo.ate)) } : null;

  const dividido = broll.some((x) => x.b.layout === 'topo' && ativo(frame, x.ini, x.dur));
  const cartelaAtiva = cartelas.some((x) => ativo(frame, x.ini, x.dur));
  const tituloAtivo = !!titulo && ativo(frame, titulo.ini, titulo.dur);
  const provaAtiva = provas.find((x) => ativo(frame, x.ini, x.dur));
  // fundo P&B desfocado durante a prova, entrando/saindo em 5 frames
  const provaMix = provaAtiva ? Math.min(1, (frame - provaAtiva.ini) / 5, (provaAtiva.ini + provaAtiva.dur - frame) / 5) : 0;
  const extraFiltro = provaMix > 0 ? `grayscale(${provaMix}) blur(${14 * provaMix}px) brightness(${1 - 0.25 * provaMix})` : undefined;

  // legenda some sob a faixa do título (estilos 1 e 2); no estilo 3 vira subtítulo do título
  const legendaOculta = cartelaAtiva || (provaAtiva?.p.tipo === 'manchete') || (tituloAtivo && plano.estilo !== 'amiga');
  const subtitulo = tituloAtivo && plano.estilo === 'amiga';
  // tela dividida: legenda na linha da divisão (50%); senão, a posição do plano ou do estilo
  // B-roll em caixa (estilo amiga): a pessoa fica na frente da faixa, então a legenda vai para a altura do peito
  const caixa = broll.some((x) => x.b.layout === 'caixa' && ativo(frame, x.ini, x.dur));
  const legendaY = subtitulo ? (plano.titulo?.y ?? tk.titulo.y) + 0.115 : dividido ? 0.5 : caixa ? 0.64 : plano.legendaY;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <ARoll
        video={plano.video}
        ts={ts}
        zoomAlternado={tk.zoomAlternado}
        zoomAuto={plano.zoomAuto ?? true}
        zoom={plano.zoom ?? []}
        respiro={tk.respiro}
        rostoY={plano.rostoY ?? 0.32}
        dividido={dividido}
        filtro={tk.cor}
        extraFiltro={extraFiltro}
      />

      {broll.map(({ b, ini, dur }, i) => (
        <Sequence key={`b${i}`} from={ini} durationInFrames={dur} layout="none">
          <BRoll b={b} />
        </Sequence>
      ))}

      {/* B-roll em caixa fica ATRÁS da pessoa: redesenha só a Thais por cima (recorte) */}
      {caixa && plano.pessoaNaFrente !== false && (
        <ARoll
          video={plano.video}
          ts={ts}
          zoomAlternado={tk.zoomAlternado}
          zoomAuto={plano.zoomAuto ?? true}
          zoom={plano.zoom ?? []}
          respiro={tk.respiro}
          rostoY={plano.rostoY ?? 0.32}
          dividido={false}
          filtro={tk.cor}
          extraFiltro={extraFiltro}
          soPessoa
        />
      )}

      {efeitos
        .filter((x) => x.e.tipo !== 'flash')
        .map(({ e, ini, dur }, i) => (
          <Sequence key={`e${i}`} from={ini} durationInFrames={dur} layout="none">
            <EfeitoC e={e} />
          </Sequence>
        ))}

      {adesivos.map(({ a, ini, dur }, i) => (
        <Sequence key={`a${i}`} from={ini} durationInFrames={dur} layout="none">
          {/* ordem dentro do grupo que entra junto (cada um 2 frames depois do anterior) */}
          <AdesivoC a={a} i={adesivos.slice(0, i).filter((x) => x.ini === ini).length} />
        </Sequence>
      ))}

      {provas.map(({ p, ini, dur }, i) => (
        <Sequence key={`p${i}`} from={ini} durationInFrames={dur} layout="none">
          <ProvaC p={p} tk={tk} dur={dur} />
        </Sequence>
      ))}

      {cartelas.map(({ c, ini, dur }, i) => (
        <Sequence key={`c${i}`} from={ini} durationInFrames={dur} layout="none">
          <Cartela pre={c.pre} destaque={c.destaque} tk={tk} dur={dur} />
        </Sequence>
      ))}

      {titulo && (
        <Sequence from={0} durationInFrames={titulo.dur} layout="none">
          <Titulo t={titulo.t} estilo={plano.estilo} tk={tk} dur={titulo.dur} />
        </Sequence>
      )}

      <Legendas blocos={blocos} tk={tk.legenda} y={legendaY} escala={subtitulo ? 0.85 : 1} oculto={legendaOculta} />

      {efeitos
        .filter((x) => x.e.tipo === 'flash')
        .map(({ e, ini, dur }, i) => (
          <Sequence key={`f${i}`} from={ini} durationInFrames={dur} layout="none">
            <EfeitoC e={e} />
          </Sequence>
        ))}

      {plano.musica && <Audio src={arquivo(plano.musica.arquivo)} volume={plano.musica.volume ?? 0.12} loop trimBefore={Math.round((plano.musica.inicio ?? 0) * fps)} />}
    </AbsoluteFill>
  );
};
