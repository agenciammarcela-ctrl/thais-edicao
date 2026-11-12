/* Demonstração de um estilo SEM gravar nada.
   Uso:  npm run demo -- <autoridade|amiga|prova>
   Cria projetos/demo-<estilo>/ com um bruto falso (voz do macOS + silhueta),
   B-roll e adesivo falsos, transcrição, cortes e um plano.json DE EXEMPLO
   com todas as camadas do estilo. Depois:  npm run render -- demo-<estilo>
   O plano gerado é a melhor referência de como preencher um plano real. */
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const estilo = process.argv[2];
const ROTEIROS = {
  autoridade: [
    'Esse é o verdadeiro motivo do seu cansaço constante.',
    'E não, não é falta de café.',
    'Quando o seu corpo não recebe ferro suficiente, as células trabalham no limite.',
    'Você dorme oito horas e acorda como se não tivesse dormido.',
    'Então antes de culpar a rotina, faça esse exame.',
  ],
  amiga: [
    'Três conselhos que eu te daria como amiga.',
    'Um. O dia que você planta a semente não é o dia que você colhe o fruto.',
    'Dois. Dar o seu melhor não significa fazer TUDO.',
    'Três. Você pode e deve respeitar o seu próprio ritmo.',
    'Manda esse vídeo pra uma amiga que precisa ouvir isso hoje.',
  ],
  prova: [
    'O YouTube paga criador. O TikTok paga criador.',
    'E o Instagram? Não paga nada.',
    'Uma pesquisa mostrou que marcas investem mais em perfis pequenos.',
    'Porque autoridade real virou autoridade percebida.',
    'Comenta QUERO que eu te mando o estudo completo.',
  ],
};
if (!ROTEIROS[estilo]) { console.log('uso: npm run demo -- <autoridade|amiga|prova>'); process.exit(1); }

const nome = `demo-${estilo}`;
const dir = path.resolve('projetos', nome);
await rm(dir, { recursive: true, force: true });
for (const p of ['_cache', 'broll', 'adesivos', 'efeitos', 'provas']) await mkdir(path.join(dir, p), { recursive: true });
const ff = (...a) => execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', ...a]);
const dura = (f) => Number(execFileSync('npx', ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

/* 1. voz com pausas (para o corte de silêncio ter o que cortar) */
let t = 0.6;
const palavras = [];
const inicios = [];
const partes = [];
ROTEIROS[estilo].forEach((fr, i) => {
  const wav = path.join(dir, '_cache', `f${i}.wav`);
  execFileSync('say', ['-v', 'Luciana', '--data-format=LEI16@22050', '-o', wav, fr]);
  const d = dura(wav);
  const ws = fr.split(' ');
  const tot = ws.reduce((s, w) => s + w.length + 1, 0);
  let c = t;
  ws.forEach((w) => {
    const dw = (d * (w.length + 1)) / tot;
    palavras.push({ t: +c.toFixed(3), f: +(c + dw * 0.9).toFixed(3), texto: w });
    c += dw;
  });
  inicios.push(t);
  partes.push({ wav, ini: t });
  t += d + (i % 2 ? 1.3 : 0.8);
});
const dur = t + 0.4;
inicios.push(dur);
const voz = path.join(dir, '_cache', 'voz.wav');
const filt = partes.map((p, i) => `[${i}:a]aresample=48000,adelay=${Math.round(p.ini * 1000)}:all=1[a${i}]`).join(';') +
  ';' + partes.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${partes.length}:normalize=0,apad=whole_dur=${dur}[out]`;
ff(...partes.flatMap((p) => ['-i', p.wav]), '-filter_complex', filt, '-map', '[out]', '-ac', '2', voz);

/* 2. vídeo falso + B-roll + adesivo, renderizados pelo próprio Remotion */
const serveUrl = await bundle({ entryPoint: path.resolve('scripts/demo/entrada.tsx'), publicDir: dir });
const comp = async (id, props) => selectComposition({ serveUrl, id, inputProps: props });
process.stdout.write('gerando bruto falso… ');
await renderMedia({ composition: await comp('Bruto', { dur }), serveUrl, codec: 'h264', outputLocation: path.join(dir, 'bruto.mp4'), inputProps: { dur } });
await renderMedia({ composition: await comp('Clipe', { cor: '#3a7bd5' }), serveUrl, codec: 'h264', outputLocation: path.join(dir, 'broll', 'clipe-azul.mp4'), inputProps: { cor: '#3a7bd5' } });
await renderMedia({ composition: await comp('Clipe', { cor: '#c0392b' }), serveUrl, codec: 'h264', outputLocation: path.join(dir, 'broll', 'clipe-vermelho.mp4'), inputProps: { cor: '#c0392b' } });
await renderStill({ composition: await comp('Clipe', { cor: '#e2a85b' }), serveUrl, output: path.join(dir, 'broll', 'foto.jpg'), inputProps: { cor: '#e2a85b' }, imageFormat: 'jpeg' });
await renderStill({ composition: await comp('Clipe', { cor: '#ff5f8f' }), serveUrl, output: path.join(dir, 'efeitos', 'flor.jpg'), inputProps: { cor: '#ff5f8f' }, imageFormat: 'jpeg' });
await renderStill({ composition: await comp('Adesivo', {}), serveUrl, output: path.join(dir, 'adesivos', 'flor.png'), imageFormat: 'png' });
await renderStill({ composition: await comp('Clipe', { cor: '#ffffff' }), serveUrl, output: path.join(dir, 'provas', 'print.png'), inputProps: { cor: '#ffffff' }, imageFormat: 'png' });
console.log('ok');

/* 3. transcrição + cortes (o mesmo que os scripts reais fazem) */
await writeFile(path.join(dir, 'transcricao.json'), JSON.stringify(palavras, null, 1));
const s = (i, mais = 0) => +(inicios[i] + mais).toFixed(2); // início da frase i (tempo do bruto)
const marca = (lista) => palavras.map((p) => (lista.includes(p.texto.replace(/[^\p{L}]/gu, '')) ? { ...p, texto: `*${p.texto}*` } : p));

/* 4. plano de exemplo de cada estilo */
const base = { estilo, video: 'bruto.mp4', fps: 30, rostoY: 0.32, cortes: [] };
const PLANOS = {
  autoridade: {
    ...base,
    zoomAuto: true,
    legendas: marca(['ferro', 'exame']),
    titulo: { texto: 'O Verdadeiro Motivo do Seu Cansaço Constante', ate: s(1) },
    broll: [
      { arquivo: 'broll/clipe-azul.mp4', em: s(0), dur: 2.8, layout: 'topo' },
      { arquivo: 'broll/clipe-vermelho.mp4', em: s(2, 0.6), dur: 2.4, layout: 'tela-cheia' },
      { arquivo: 'broll/foto.jpg', em: s(3), dur: 2.6, layout: 'topo' },
    ],
  },
  amiga: {
    ...base,
    zoomAuto: false,
    legendas: marca(['semente', 'TUDO', 'ritmo']),
    titulo: { texto: '3 CONSELHOS', estrelas: 5, ate: s(1) },
    adesivos: [
      { arquivo: 'adesivos/flor.png', em: s(0), dur: 2.6, x: 0.16, y: 0.42, larg: 0.24, rot: -10 },
      { arquivo: 'adesivos/flor.png', em: s(0), dur: 2.6, x: 0.84, y: 0.36, larg: 0.2, rot: 8 },
      { arquivo: 'adesivos/flor.png', em: s(0), dur: 2.6, x: 0.2, y: 0.8, larg: 0.22, rot: 4 },
    ],
    efeitos: [
      { tipo: 'sobreposicao', arquivo: 'efeitos/flor.jpg', em: s(1, 0.3), dur: 2.4, opacidade: 0.5 },
      { tipo: 'luz', em: s(3), dur: 2.2, cor: 'quente' },
      { tipo: 'brilho', em: s(4), dur: 2 },
    ],
    broll: [{ arquivo: 'broll/clipe-azul.mp4', em: s(2), dur: 2.4, layout: 'caixa' }],
  },
  prova: {
    ...base,
    zoomAuto: true,
    legendas: marca(['nada', 'percebida']),
    broll: [{ arquivo: 'broll/clipe-vermelho.mp4', em: s(0), dur: 2.6, layout: 'topo' }],
    efeitos: [{ tipo: 'flash', em: s(1), dur: 0.35 }],
    provas: [
      { tipo: 'manchete', em: s(2), dur: 2.4, texto: 'Marcas investem mais em perfis pequenos', fonte: 'Pesquisa fictícia, 2026' },
    ],
    cartelas: [{ em: s(3), dur: 2.4, pre: 'autoridade real virou', destaque: 'autoridade percebida' }],
  },
};
await writeFile(path.join(dir, 'plano.json'), JSON.stringify(PLANOS[estilo], null, 2));
execFileSync('node', ['scripts/cortes.mjs', nome], { stdio: 'inherit' });
console.log(`demo pronta → projetos/${nome}   próximo: npm run render -- ${nome}`);
