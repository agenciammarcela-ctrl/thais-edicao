/* CONFERIR — prova que o corte não comeu palavra.
   Uso:  npm run conferir -- <nome>
   Monta só o ÁUDIO cortado (rápido, sem renderizar vídeo), transcreve de novo
   com o whisper e compara palavra por palavra com a fala que deveria ter ficado.
   Lista: palavras FALTANDO (cortadas por engano) com o tempo do bruto, e
   palavras SOBRANDO (o whisper ouviu algo que não estava na transcrição — às
   vezes é "é…", "ahn", palavra repetida: candidatos a corte).
   Gera projetos/<nome>/_cache/conferencia.txt
   --aplicar: troca plano.legendas pela transcrição do áudio CORTADO (bem mais
   sincronizada: sem pausas, o whisper não estica palavra), levando junto as
   correções de texto e os *destaques* da legenda antiga onde as palavras batem. */
import { transcribe, toCaptions } from '@remotion/install-whisper-cpp';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { WHISPER } from './config.mjs';

const aplicar = process.argv.includes('--aplicar');
const nome = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!nome) { console.log('uso: npm run conferir -- <nome>'); process.exit(1); }
const dir = path.join('projetos', nome);
const plano = JSON.parse(await readFile(path.join(dir, 'plano.json'), 'utf8'));
// a legenda do plano é a versão corrigida (grafia, *destaques*); a transcrição bruta é o plano B
const palavras = plano.legendas?.length ? plano.legendas : JSON.parse(await readFile(path.join(dir, 'transcricao.json'), 'utf8'));
const cortes = [...plano.cortes].sort((a, b) => a[0] - b[0]);

/* 1. áudio cortado */
const wav = path.join(dir, '_cache', 'audio16k.wav');
const saida = path.join(dir, '_cache', 'cortado16k.wav');
const filtro = cortes.map(([a, b], i) => `[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS[a${i}]`).join(';') +
  ';' + cortes.map((_, i) => `[a${i}]`).join('') + `concat=n=${cortes.length}:v=0:a=1[out]`;
await writeFile(path.join(dir, '_cache', 'filtro.txt'), filtro);
execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-filter_complex_script', path.join(dir, '_cache', 'filtro.txt'), '-map', '[out]', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', saida]);

/* 2. transcreve o resultado */
const json = await transcribe({
  inputPath: path.resolve(saida), whisperPath: path.resolve(WHISPER.pasta), whisperCppVersion: WHISPER.versao,
  model: WHISPER.modelo, tokenLevelTimestamps: true, language: 'pt', splitOnWord: true, printOutput: false,
});
const { captions } = toCaptions({ whisperCppOutput: json });
// tempo no áudio cortado → tempo no bruto
const mapa = [];
{ let acc = 0; for (const [a, b] of cortes) { mapa.push({ a, b, i: acc }); acc += b - a; } }
const paraBruto = (t) => { for (const m of mapa) if (t <= m.i + (m.b - m.a)) return m.a + Math.max(0, t - m.i); const u = mapa[mapa.length - 1]; return u.b; };
const ouvidas = captions.map((c) => ({ texto: c.text.trim(), t: c.startMs / 1000, f: c.endMs / 1000 })).filter((w) => w.texto);

/* 3. o que deveria ter ficado */
// mesmo critério do vídeo: só o núcleo da palavra (últimos 0,4 s) conta — o começo é esticado pelo whisper
const mantida = (w) => { const ia = Math.max(w.t, w.f - 0.4); return cortes.some(([a, b]) => Math.min(w.f, b) - Math.max(ia, a) >= Math.min(0.08, (w.f - ia) * 0.5)); };
const esperadas = palavras.filter(mantida);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%]/g, '');
const A = esperadas.map((w) => norm(w.texto)), B = ouvidas.map((w) => norm(w.texto));

/* 4. alinhamento (LCS) */
const L = Array.from({ length: A.length + 1 }, () => new Int32Array(B.length + 1));
for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--)
  L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
const faltando = [], sobrando = [];
let i = 0, j = 0;
while (i < A.length || j < B.length) {
  if (i < A.length && j < B.length && A[i] === B[j]) { i++; j++; }
  else if (j < B.length && (i === A.length || L[i][j + 1] >= L[i + 1][j])) { sobrando.push({ ...ouvidas[j], antes: esperadas[i - 1]?.texto }); j++; }
  else { faltando.push({ ...esperadas[i], ctx: esperadas.slice(Math.max(0, i - 3), i + 4).map((w) => w.texto).join(' ') }); i++; }
}
const pct = ((1 - faltando.length / Math.max(1, A.length)) * 100).toFixed(1);
const rel = [
  `CONFERÊNCIA ${nome}: ${A.length} palavras esperadas, ${B.length} ouvidas no corte · ${pct}% batem`,
  '', `FALTANDO (${faltando.length}) — tempo do bruto · contexto:`,
  ...faltando.map((w) => `  ${w.t.toFixed(2)}  "${w.texto}"   … ${w.ctx}`),
  '', `SOBRANDO (${sobrando.length}) — o whisper ouviu a mais (pode ser hesitação/repetição ou só variação de transcrição):`,
  ...sobrando.map((w) => `  "${w.texto}" depois de "${w.antes ?? '(início)'}"`),
].join('\n');
await writeFile(path.join(dir, '_cache', 'conferencia.txt'), rel + '\n');
console.log(rel);

if (aplicar) {
  // COMBINA as duas transcrições: TEXTO da legenda atual (completa, corrigida, com
  // *destaques*) + TEMPO da transcrição do áudio cortado (precisa). O whisper no
  // áudio cortado às vezes pula palavrinha ("o", "a", "e") ou troca
  // ("segunda"→"segundo"); por isso o texto nunca vem só dele.
  const pares = [];
  { let i = 0, j = 0;
    while (i < A.length || j < B.length) {
      if (i < A.length && j < B.length && A[i] === B[j]) { pares.push({ v: esperadas[i], n: ouvidas[j] }); i++; j++; }
      else if (j < B.length && (i === A.length || L[i][j + 1] >= L[i + 1][j])) { pares.push({ n: ouvidas[j] }); j++; }
      else { pares.push({ v: esperadas[i] }); i++; }
    } }
  const saida = [];
  let k = 0;
  while (k < pares.length) {
    if (pares[k].v && pares[k].n) {
      const { v, n } = pares[k];
      saida.push({ texto: v.texto, t: paraBruto(n.t), f: paraBruto(Math.max(n.t + 0.05, n.f)) });
      k++; continue;
    }
    // trecho sem casamento: olds e news entre duas âncoras
    const velhas = [], novas = [];
    while (k < pares.length && !(pares[k].v && pares[k].n)) { if (pares[k].v) velhas.push(pares[k].v); else novas.push(pares[k].n); k++; }
    if (!velhas.length) { // só o whisper novo ouviu (ex.: um "né?" a mais): entra
      for (const n of novas) saida.push({ texto: n.texto, t: paraBruto(n.t), f: paraBruto(Math.max(n.t + 0.05, n.f)) });
      continue;
    }
    // troca palavra-a-palavra (texto antigo, tempo novo)
    const m = Math.min(velhas.length, novas.length);
    for (let x = 0; x < m; x++) saida.push({ texto: velhas[x].texto, t: paraBruto(novas[x].t), f: paraBruto(Math.max(novas[x].t + 0.05, novas[x].f)) });
    // palavras a mais que só o whisper novo ouviu: entram ("tá funcionando")
    for (let x = m; x < novas.length; x++) saida.push({ texto: novas[x].texto, t: paraBruto(novas[x].t), f: paraBruto(Math.max(novas[x].t + 0.05, novas[x].f)) });
    // palavras antigas que o novo NÃO ouviu: só palavrinha (o, a, e, de, na…) — o
    // whisper costuma pular essas; palavra longa sem eco no áudio cortado = foi cortada
    for (let x = m; x < velhas.length; x++) if (norm(velhas[x].texto).length <= 3) saida.push({ texto: velhas[x].texto, t: null, f: null });
  }
  // preenche tempos que faltaram: divide o espaço entre os vizinhos
  for (let x = 0; x < saida.length; x++) {
    if (saida[x].t !== null) continue;
    let y = x; while (y < saida.length && saida[y].t === null) y++;
    const ini = x > 0 ? saida[x - 1].f : (saida[y]?.t ?? 0) - 0.3;
    const fim = y < saida.length ? saida[y].t : ini + 0.3 * (y - x);
    const passo = Math.max(0.05, (fim - ini) / (y - x));
    for (let z = x; z < y; z++) { saida[z].t = ini + passo * (z - x); saida[z].f = saida[z].t + passo; }
  }
  const novasLegendas = saida.map((w) => ({ t: +w.t.toFixed(3), f: +Math.max(w.f, w.t + 0.05).toFixed(3), texto: w.texto }));
  const p2 = JSON.parse(await readFile(path.join(dir, 'plano.json'), 'utf8'));
  p2.legendas = novasLegendas;
  await writeFile(path.join(dir, 'plano.json'), JSON.stringify(p2, null, 2));
  console.log(`\nlegenda recombinada: ${novasLegendas.length} palavras (texto da legenda antiga + tempo do áudio cortado)`);
}
