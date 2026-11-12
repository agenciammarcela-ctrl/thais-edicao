/* Corta silêncios e respiros (jump cuts), detectando o silêncio no ÁUDIO.
   Uso:  npm run cortes -- <nome> [pausaMax=0.45] [limiar=-35]
   - pausaMax: pausas maiores que isso (s) são removidas
   - limiar: volume (dB) abaixo do qual é silêncio; suba para -30 se o ambiente
     for barulhento e nada for cortado, desça para -40 se cortar sílabas
   Deixa uma folga antes e depois de cada fala para não "comer" sílabas.
   (Os tempos de palavra do whisper esticam sobre as pausas, por isso não
   servem para achar silêncio.)
   Grava plano.cortes — SUBSTITUI os cortes anteriores. Para tirar frases
   regravadas depois, use `npm run remover`. */
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const [nome, pausaArg, limiarArg] = process.argv.slice(2);
if (!nome) { console.log('uso: npm run cortes -- <nome> [pausaMax] [limiar]'); process.exit(1); }
const PAUSA = Number(pausaArg ?? 0.45);
const LIMIAR = Number(limiarArg ?? -35);
const FOLGA_ANTES = 0.1;
const FOLGA_DEPOIS = 0.16;

const dir = path.join('projetos', nome);
const planoPath = path.join(dir, 'plano.json');
const plano = JSON.parse(await readFile(planoPath, 'utf8'));
const video = path.join(dir, plano.video);

const detectar = (db, dur) => {
  const r = spawnSync('npx', ['remotion', 'ffmpeg', '-hide_banner', '-i', video, '-vn', '-af', `silencedetect=n=${db}dB:d=${dur}`, '-f', 'null', '-'], { encoding: 'utf8' });
  const log = r.stderr;
  const total = Number((log.match(/Duration: (\d+):(\d+):([\d.]+)/) || []).slice(1).reduce((s, v, i) => s + Number(v) * [3600, 60, 1][i], 0));
  const lista = [];
  let ini = null;
  for (const l of log.split('\n')) {
    const a = l.match(/silence_start: ([\d.]+)/);
    const b = l.match(/silence_end: ([\d.]+)/);
    if (a) ini = Number(a[1]);
    if (b && ini !== null) { lista.push([ini, Number(b[1])]); ini = null; }
  }
  if (ini !== null) lista.push([ini, total]);
  return { total, lista };
};
const { total, lista: candidatos } = detectar(LIMIAR, PAUSA);
// trava de segurança: palavra dita baixinho ("fome", "sim") fica logo abaixo do limiar e
// parece silêncio. Silêncio de verdade continua silêncio 3 dB abaixo; fala baixa não.
const { lista: profundos } = detectar(LIMIAR - 3, 0.15);
const cobre = ([a, b]) => profundos.reduce((s, [x, y]) => s + Math.max(0, Math.min(b, y) - Math.max(a, x)), 0) / (b - a);
let silencios = candidatos.filter((g) => cobre(g) >= 0.7);
const salvos = candidatos.length - silencios.length;
if (salvos) console.log(`${salvos} "silêncio(s)" ignorado(s): tinham fala baixa (não sumiam ${LIMIAR - 3} dB)`);

// segunda trava: palavra CURTA da transcrição (≤ 0,6 s — palavra esticada pelo whisper
// não conta) que cai dentro de um "silêncio" foi dita baixinho: o silêncio encolhe para
// não comê-la ("Com o", "isso", "vem", "e"). Se sobrar menos que a pausa mínima, não corta.
let palavras = [];
try { palavras = JSON.parse(await readFile(path.join(dir, 'transcricao.json'), 'utf8')); } catch {}
const curtas = palavras.filter((w) => w.f - w.t > 0.03 && w.f - w.t <= 0.6);
let encolhidos = 0;
silencios = silencios.flatMap(([ga, gb]) => {
  let a = ga, b = gb;
  for (const w of curtas) {
    const dentro = Math.min(w.f, b) - Math.max(w.t, a);
    if (dentro <= 0 || dentro / (w.f - w.t) < 0.5) continue;
    encolhidos++;
    // a palavra fica do lado mais perto da borda do silêncio
    if (w.t - a < b - w.f) a = w.f + 0.06; else b = w.t - 0.06;
  }
  return b - a >= PAUSA ? [[a, b]] : [];
});
if (encolhidos) console.log(`${encolhidos} palavra(s) curta(s) protegida(s) dentro de "silêncios"`);

// fala = complemento dos silêncios, com folga
const cortes = [];
let cursor = 0;
for (const [s, e] of silencios) {
  const a = Math.max(0, cursor - (cursor === 0 ? 0 : FOLGA_ANTES));
  const b = Math.min(total, s + FOLGA_DEPOIS);
  if (b - a > 0.15) cortes.push([+a.toFixed(3), +b.toFixed(3)]);
  cursor = e;
}
if (total - cursor > 0.15) cortes.push([+Math.max(0, cursor - FOLGA_ANTES).toFixed(3), +total.toFixed(3)]);

const final = cortes.reduce((s, [a, b]) => s + b - a, 0);
plano.cortes = cortes;
await writeFile(planoPath, JSON.stringify(plano, null, 2));
console.log(`${cortes.length} trechos · bruto ${total.toFixed(1)}s → ${final.toFixed(1)}s (−${(total - final).toFixed(1)}s de pausas; ${silencios.length} silêncios ≥ ${PAUSA}s abaixo de ${LIMIAR} dB)`);
