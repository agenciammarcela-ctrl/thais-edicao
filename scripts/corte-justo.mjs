/* CORTE JUSTO — o corte "profissional" de Reels: emenda frase com frase, tira
   respiração, pausa e "ar" entre as falas, e deixa só o respiro natural.

   Uso:  npm run justo -- <nome> [folga=0.10]
   (rode depois de `npm run transcrever`; depois use `npm run remover` para
   regravações/erros e `npm run conferir` para provar que nenhuma palavra sumiu)

   Como funciona (o Claude não ouve — ele mede):
   1. Lê o áudio em blocos de 10 ms e mede o volume (dB) e o "chiado" (taxa de
      cruzamento por zero). Voz = volume alto e pouco chiado; respiração = volume
      médio-baixo e muito chiado; silêncio = volume no piso.
   2. Os limiares saem do próprio vídeo: piso = percentil 10, voz = percentil 90.
   3. Ilhas de voz são estendidas para pegar começo/fim suaves de palavra, mas a
      extensão para quando vira respiração (chiado sustentado > 120 ms).
   4. Buracos ≥ 0,22 s entre ilhas são cortados, deixando `folga` de ar
      (padrão 0,10 s: 0,06 depois da fala + 0,04 antes da próxima).
   5. Palavra curta da transcrição que cair num buraco é protegida.
   Grava plano.cortes (SUBSTITUI os anteriores). */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const [nome, folgaArg] = process.argv.slice(2);
if (!nome) { console.log('uso: npm run justo -- <nome> [folga]'); process.exit(1); }
const FOLGA = Number(folgaArg ?? 0.1);
const DEPOIS = FOLGA * 0.6, ANTES = FOLGA * 0.4;
const BURACO_MIN = 0.22;

const dir = path.join('projetos', nome);
const planoPath = path.join(dir, 'plano.json');
const plano = JSON.parse(await readFile(planoPath, 'utf8'));
const wav = path.join(dir, '_cache', 'audio16k.wav');
if (!existsSync(wav)) execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', path.join(dir, plano.video), '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);

/* ---- 1. envelope de 10 ms ---- */
const buf = await readFile(wav);
let o = 12, data = null;
while (o < buf.length) {
  const id = buf.toString('ascii', o, o + 4), sz = buf.readUInt32LE(o + 4);
  if (id === 'data') { data = buf.subarray(o + 8, o + 8 + sz); break; }
  o += 8 + sz;
}
const SR = 16000, WIN = 160, PASSO = WIN / SR; // 10 ms
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
// suaviza 30 ms (média móvel) para não picotar dentro de sílaba
const dbs = new Float32Array(N);
for (let f = 0; f < N; f++) { let s = 0, c = 0; for (let k = -1; k <= 1; k++) if (f + k >= 0 && f + k < N) { s += db[f + k]; c++; } dbs[f] = s / c; }

/* ---- 2. limiares do próprio vídeo ---- */
const ord = Array.from(dbs).sort((a, b) => a - b);
const P = (p) => ord[Math.floor(p * (N - 1))];
const PISO = P(0.1), VOZ = P(0.9);
const ALTO = PISO + 0.55 * (VOZ - PISO);   // certeza de voz
const BAIXO = PISO + 0.28 * (VOZ - PISO);  // começo/fim suave de palavra
const CHIADO = 0.28;                        // ZCR acima disso com volume baixo = respiração/ar

/* ---- 3. ilhas de voz com histerese ---- */
const voz = new Uint8Array(N);
for (let f = 0; f < N; f++) if (dbs[f] > ALTO) voz[f] = 1;
const estende = (dirc) => {
  for (let f = dirc > 0 ? 1 : N - 2; dirc > 0 ? f < N : f >= 0; f += dirc) {
    if (voz[f] || !voz[f - dirc]) continue;
    // anda a partir da borda da ilha enquanto estiver acima do BAIXO, parando em respiração
    let g = f, chiado = 0;
    while (g >= 0 && g < N && !voz[g] && dbs[g] > BAIXO) {
      chiado = zc[g] > CHIADO && dbs[g] < ALTO - 3 ? chiado + 1 : 0;
      if (chiado > 12) { g -= dirc * 12; break; } // 120 ms de chiado = respiração: devolve
      g += dirc;
    }
    for (let h = f; h !== g; h += dirc) voz[h] = 2;
    f = g;
  }
};
estende(1);
estende(-1);

// junta ilhas separadas por menos de BURACO_MIN (respiro natural entre palavras)
const ilhas = [];
for (let f = 0; f < N; f++) {
  if (!voz[f]) continue;
  let g = f;
  while (g < N && voz[g]) g++;
  ilhas.push([f * PASSO, g * PASSO]);
  f = g;
}
const juntas = [];
for (const il of ilhas) {
  const u = juntas[juntas.length - 1];
  if (u && il[0] - u[1] < BURACO_MIN) u[1] = il[1];
  else juntas.push([...il]);
}
// descarta "ilhas" minúsculas isoladas (estalo, batida) < 60 ms
const falas = juntas.filter(([a, b]) => b - a >= 0.06);

/* ---- 4. buracos → cortes, com folga ---- */
let cortes = falas.map(([a, b]) => [Math.max(0, a - ANTES), b + DEPOIS]);

/* ---- 5. protege palavra curta da transcrição que caiu num buraco ---- */
let palavras = [];
try { palavras = JSON.parse(await readFile(path.join(dir, 'transcricao.json'), 'utf8')); } catch {}
let protegidas = 0;
for (const w of palavras) {
  const d = w.f - w.t;
  if (d <= 0.03 || d > 0.6) continue; // palavra esticada pelo whisper não é confiável
  const coberto = cortes.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, w.f) - Math.max(a, w.t)), 0);
  if (coberto / d < 0.5) { cortes.push([w.t - 0.03, w.f + 0.05]); protegidas++; }
}
cortes.sort((x, y) => x[0] - y[0]);
const fund = [];
for (const c of cortes) {
  const u = fund[fund.length - 1];
  if (u && c[0] <= u[1] + 0.02) u[1] = Math.max(u[1], c[1]);
  else fund.push([...c]);
}
cortes = fund.map(([a, b]) => [+a.toFixed(3), +b.toFixed(3)]);

const total = N * PASSO;
const final = cortes.reduce((s, [a, b]) => s + b - a, 0);
plano.cortes = cortes;
await writeFile(planoPath, JSON.stringify(plano, null, 2));
console.log(`piso ${PISO.toFixed(1)} dB · voz ${VOZ.toFixed(1)} dB · limiar ${ALTO.toFixed(1)}/${BAIXO.toFixed(1)} dB`);
console.log(`${cortes.length} trechos · bruto ${total.toFixed(1)}s → ${final.toFixed(1)}s (−${(total - final).toFixed(1)}s de pausa e respiração)${protegidas ? ` · ${protegidas} palavra(s) curta(s) protegida(s)` : ''}`);
