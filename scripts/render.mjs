/* Renderiza o vídeo final em MP4 (1080×1920, H.264, áudio AAC).
   Uso:  npm run render -- <nome> [--rapido]
   --rapido = metade da resolução, para conferir antes do render final.
   Saída: projetos/<nome>/saida/<nome>.mp4 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const nome = args.find((a) => !a.startsWith('--'));
const rapido = args.includes('--rapido');
if (!nome) { console.log('uso: npm run render -- <nome> [--rapido]'); process.exit(1); }

const dir = path.resolve('projetos', nome);
const plano = JSON.parse(await readFile(path.join(dir, 'plano.json'), 'utf8'));
if (!plano.cortes?.length) { console.log('plano.cortes está vazio — rode `npm run cortes` antes.'); process.exit(1); }

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: dir });
const composition = await selectComposition({ serveUrl, id: 'Video', inputProps: plano });
await mkdir(path.join(dir, 'saida'), { recursive: true });
const out = path.join(dir, 'saida', `${nome}${rapido ? '-rapido' : ''}.mp4`);

await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  crf: rapido ? 28 : 18,
  scale: rapido ? 0.5 : 1,
  outputLocation: out,
  inputProps: plano,
  onProgress: ({ progress }) => process.stdout.write(`\rrenderizando ${(progress * 100).toFixed(0)}%`),
});
console.log(`\npronto → ${path.relative(process.cwd(), out)} (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`);
