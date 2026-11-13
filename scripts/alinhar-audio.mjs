/* ALINHAR ÁUDIO — conserta bruto em que o áudio começa DEPOIS do vídeo.
   Uso:  npm run alinhar -- <nome>

   Vídeo de iPhone às vezes vem com o áudio começando 0,1–0,8 s depois do
   primeiro quadro (start_time do áudio > 0). O player respeita isso, mas o WAV
   que a transcrição e o corte usam começa no 1º sample — então TODO tempo medido
   (whisper, envelope, cortes) fica adiantado em relação ao vídeo: legenda fora de
   sincronia e lábio descolado da voz. (Aconteceu no thais-01: 0,785 s.)

   O que faz: recria o áudio do bruto.mp4 com silêncio no começo (áudio e vídeo
   passam a começar juntos no 0), apaga o WAV do _cache e desloca todos os tempos
   do bruto no plano.json e na transcricao.json pelo atraso. Projetos novos já
   nascem alinhados (novo-projeto.mjs). Rodar de novo num projeto alinhado não faz nada. */
import { readFile, writeFile, rm, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const nome = process.argv[2];
if (!nome) { console.log('uso: npm run alinhar -- <nome>'); process.exit(1); }
const dir = path.join('projetos', nome);
const planoPath = path.join(dir, 'plano.json');
const plano = JSON.parse(await readFile(planoPath, 'utf8'));
const video = path.join(dir, plano.video);

const sonda = (arq) => Object.fromEntries(execFileSync('npx', ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,start_time,duration', '-of', 'compact=p=0:nk=0', arq], { encoding: 'utf8' })
  .trim().split('\n').map((l) => Object.fromEntries(l.split('|').map((kv) => kv.split('=')))).map((s) => [s.codec_type, { ini: Number(s.start_time) || 0, dur: Number(s.duration) }]));

const s = sonda(video);
const atraso = +(s.audio.ini - s.video.ini).toFixed(3);
if (Math.abs(atraso) < 0.02) { console.log(`${nome}: áudio e vídeo já começam juntos (diferença ${atraso}s). Nada a fazer.`); process.exit(0); }
console.log(`${nome}: áudio começa ${atraso}s depois do vídeo → alinhando`);

/* 1. bruto com o áudio preenchido de silêncio desde o 0 */
const tmp = path.join(dir, '_alinhado.mp4');
execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-map', '0:v:0', '-map', '0:a:0',
  '-c:v', 'copy', '-af', 'aresample=async=1:first_pts=0', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
const s2 = sonda(tmp);
if (Math.abs(s2.audio.ini - s2.video.ini) > 0.02) throw new Error(`não alinhou: áudio ${s2.audio.ini} vídeo ${s2.video.ini}`);
await rename(tmp, video);
await rm(path.join(dir, '_cache', 'cortado16k.wav'), { force: true });
// WAV de análise refeito do bruto alinhado (agora com o silêncio do começo)
execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', path.join(dir, '_cache', 'audio16k.wav')]);

/* 2. desloca os tempos do bruto */
const lim = s.video.dur;
const d = (t) => +Math.min(lim, t + atraso).toFixed(3);
plano.cortes = (plano.cortes ?? []).map(([a, b]) => [d(a), d(b)]);
plano.legendas = (plano.legendas ?? []).map((w) => ({ ...w, t: d(w.t), f: d(w.f) }));
for (const k of ['broll', 'adesivos', 'efeitos', 'provas', 'cartelas', 'zoom']) plano[k] = (plano[k] ?? []).map((x) => ({ ...x, em: d(x.em) }));
if (plano.titulo?.ate != null) plano.titulo.ate = d(plano.titulo.ate);
await writeFile(planoPath, JSON.stringify(plano, null, 2));
const trPath = path.join(dir, 'transcricao.json');
if (existsSync(trPath)) {
  const tr = JSON.parse(await readFile(trPath, 'utf8'));
  await writeFile(trPath, JSON.stringify(tr.map((w) => ({ ...w, t: d(w.t), f: d(w.f) })), null, 2));
}
console.log(`ok: bruto alinhado e ${plano.cortes.length} cortes, ${plano.legendas.length} palavras e camadas deslocados +${atraso}s`);
