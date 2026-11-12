/* Conferência visual: tira fotos de alguns segundos do vídeo FINAL e monta
   uma folha de contato. O Claude não "assiste" vídeo — ele confere frames.
   Uso:  npm run snap -- <nome> 0 2.5 8 15 30      (segundos do vídeo final)
         npm run snap -- <nome> auto               (12 pontos espalhados)
   Saída: projetos/<nome>/snaps/folha.jpg (+ um jpg por segundo pedido, em 1/4 do tamanho) */
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const [nome, ...tempos] = process.argv.slice(2);
if (!nome || !tempos.length) { console.log('uso: npm run snap -- <nome> <seg> [seg...] | auto'); process.exit(1); }
const dir = path.resolve('projetos', nome);
const plano = JSON.parse(await readFile(path.join(dir, 'plano.json'), 'utf8'));
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: dir });
const composition = await selectComposition({ serveUrl, id: 'Video', inputProps: plano });
const dur = composition.durationInFrames / composition.fps;

const lista = tempos[0] === 'auto'
  ? Array.from({ length: 12 }, (_, i) => +((dur * (i + 0.5)) / 12).toFixed(2))
  : tempos.map(Number);

const out = path.join(dir, 'snaps');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const arquivos = [];
for (const [i, s] of lista.entries()) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const f = path.join(out, `${String(i).padStart(2, '0')}_t${s.toFixed(2).replace('.', '_')}.jpg`);
  await renderStill({ composition, serveUrl, output: f, frame, inputProps: plano, imageFormat: 'jpeg', scale: 0.25 });
  arquivos.push(f);
  process.stdout.write(`${s}s `);
}
// folha de contato: 6 por linha, com o segundo escrito em cada quadro
const imagens = [];
for (const [i, f] of arquivos.entries()) imagens.push({ src: 'data:image/jpeg;base64,' + (await readFile(f)).toString('base64'), rotulo: `${lista[i]}s` });
const props = { imagens, cols: Math.min(6, imagens.length) };
const folha = await selectComposition({ serveUrl, id: 'Folha', inputProps: props });
await renderStill({ composition: folha, serveUrl, output: path.join(out, 'folha.jpg'), inputProps: props, imageFormat: 'jpeg' });
console.log(`\nfolha → ${path.relative(process.cwd(), path.join(out, 'folha.jpg'))}`);
