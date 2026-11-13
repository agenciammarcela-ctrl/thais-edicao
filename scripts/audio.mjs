/* Envelope de áudio compartilhado: volume (dB) e "chiado" (ZCR) em blocos de 10 ms,
   lidos do WAV 16 kHz mono que a transcrição gera em _cache/audio16k.wav. */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const PASSO = 0.01; // 10 ms

export const envelope = async (dir, video) => {
  const wav = path.join(dir, '_cache', 'audio16k.wav');
  if (!existsSync(wav)) execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', path.join(dir, video), '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
  const buf = await readFile(wav);
  let o = 12, data = null;
  while (o < buf.length) {
    const id = buf.toString('ascii', o, o + 4), sz = buf.readUInt32LE(o + 4);
    if (id === 'data') { data = buf.subarray(o + 8, o + 8 + sz); break; }
    o += 8 + sz;
  }
  const WIN = 160;
  const N = Math.floor(data.length / 2 / WIN);
  const db = new Float32Array(N), zc = new Float32Array(N);
  for (let f = 0; f < N; f++) {
    let s = 0, z = 0, prev = 0;
    for (let k = 0; k < WIN; k++) {
      const v = data.readInt16LE((f * WIN + k) * 2) / 32768;
      s += v * v;
      if (k && (v >= 0) !== (prev >= 0)) z++;
      prev = v;
    }
    db[f] = 10 * Math.log10(s / WIN + 1e-12);
    zc[f] = z / WIN;
  }
  // média móvel de 30 ms
  const dbs = new Float32Array(N);
  for (let f = 0; f < N; f++) { let s = 0, c = 0; for (let k = -1; k <= 1; k++) if (f + k >= 0 && f + k < N) { s += db[f + k]; c++; } dbs[f] = s / c; }
  return { N, db: dbs, zc, total: N * PASSO };
};

/** Ponto mais silencioso perto de t (± janela s) — é onde um editor corta. */
export const vale = (env, t, janela = 0.15) => {
  const a = Math.max(0, Math.round((t - janela) / PASSO)), b = Math.min(env.N - 1, Math.round((t + janela) / PASSO));
  let melhor = Math.round(t / PASSO), min = Infinity;
  for (let f = a; f <= b; f++) {
    // penaliza levemente a distância para não fugir demais do ponto pedido
    const custo = env.db[f] + Math.abs(f * PASSO - t) * 8;
    if (custo < min) { min = custo; melhor = f; }
  }
  return +(melhor * PASSO).toFixed(3);
};
