/* Cria a pasta de um vídeo novo.
   Uso:  npm run novo -- <nome> <estilo> [caminho/do/bruto.mp4]
   estilo: autoridade | amiga | prova
   Resultado: projetos/<nome>/ com plano.json inicial e pastas para B-roll,
   adesivos, efeitos e música. */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const [nome, estilo = 'autoridade', bruto] = process.argv.slice(2);
const ESTILOS = ['autoridade', 'amiga', 'prova'];
if (!nome || !ESTILOS.includes(estilo)) {
  console.log('uso: npm run novo -- <nome> <autoridade|amiga|prova> [bruto.mp4]');
  process.exit(1);
}
const dir = path.join('projetos', nome);
try {
  await access(path.join(dir, 'plano.json'));
  console.log(`projetos/${nome} já existe — nada foi alterado.`);
  process.exit(1);
} catch {}

for (const p of ['broll', 'adesivos', 'efeitos', 'musica', 'provas']) await mkdir(path.join(dir, p), { recursive: true });

if (bruto) {
  // padroniza o bruto: H.264, 30 fps constantes, áudio AAC. Vídeo de iPhone vem em
  // HEVC e com fps variável — isso desalinha corte e legenda se não for convertido.
  // E o áudio às vezes começa depois do 1º quadro: aresample first_pts=0 preenche de
  // silêncio para áudio e vídeo começarem juntos (senão TODO tempo medido fica adiantado).
  console.log('convertendo o bruto para H.264 30 fps…');
  execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', bruto,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-r', '30', '-pix_fmt', 'yuv420p',
    '-af', 'aresample=async=1:first_pts=0', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path.join(dir, 'bruto.mp4')], { stdio: 'inherit' });
}

const plano = {
  estilo,
  video: 'bruto.mp4',
  fps: 30,
  rostoY: 0.32,
  cortes: [],
  legendas: [],
  zoomAuto: estilo !== 'amiga',
  titulo: null,
  broll: [],
  adesivos: [],
  efeitos: [],
  cartelas: [],
  provas: [],
};
await writeFile(path.join(dir, 'plano.json'), JSON.stringify(plano, null, 2));
console.log(`criado projetos/${nome} (estilo ${estilo})${bruto ? '' : ' — coloque o vídeo como projetos/' + nome + '/bruto.mp4'}`);
