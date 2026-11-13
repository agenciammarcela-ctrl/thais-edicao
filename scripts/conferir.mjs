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
  // casa palavras ouvidas com as antigas (LCS acima) para herdar texto corrigido e destaque
  const herda = new Map();
  { let i = 0, j = 0;
    while (i < A.length && j < B.length) {
      if (A[i] === B[j]) { herda.set(j, esperadas[i].texto); i++; j++; }
      else if (L[i][j + 1] >= L[i + 1][j]) j++; else i++;
    } }
  const novas = ouvidas.map((w, j) => {
    const antiga = herda.get(j);
    let texto = w.texto;
    if (antiga) texto = antiga; // mesma palavra: mantém grafia corrigida + *destaque*
    const t = paraBruto(w.t), f = paraBruto(Math.max(w.t + 0.05, w.f));
    return { t: +t.toFixed(3), f: +Math.max(f, t + 0.05).toFixed(3), texto };
  });
  const p2 = JSON.parse(await readFile(path.join(dir, 'plano.json'), 'utf8'));
  p2.legendas = novas;
  await writeFile(path.join(dir, 'plano.json'), JSON.stringify(p2, null, 2));
  console.log(`\nlegendas trocadas pela transcrição do áudio cortado (${novas.length} palavras, ${herda.size} herdaram texto/destaque)`);
}
