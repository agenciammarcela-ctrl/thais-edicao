/* Remove trechos do bruto (frases regravadas, começos em falso, sobras).
   Uso:  npm run remover -- <nome> 24.6-32.2 85.6-94.35 214.3-fim
   Tempos em segundos do BRUTO (os mesmos da transcricao.txt). "fim" = até o final.
   Subtrai os intervalos de plano.cortes; o resto do plano não muda.
   Cada borda é "imantada" no ponto mais silencioso a até 0,15 s (o vale entre
   palavras): os tempos do whisper erram ~0,1 s e cortar neles raspa sílaba.
   Use --exato para desligar o ímã. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { envelope, vale } from './audio.mjs';

const args = process.argv.slice(2);
const exato = args.includes('--exato');
const [nome, ...faixas] = args.filter((a) => a !== '--exato');
if (!nome || !faixas.length) { console.log('uso: npm run remover -- <nome> <ini-fim> [ini-fim...]'); process.exit(1); }
const planoPath = path.join('projetos', nome, 'plano.json');
const plano = JSON.parse(await readFile(planoPath, 'utf8'));
const antes = plano.cortes.reduce((s, [a, b]) => s + b - a, 0);

let cortes = plano.cortes;
const env = exato ? null : await envelope(path.join('projetos', nome), plano.video);
for (const f of faixas) {
  const [a, bTxt] = f.split('-');
  let ra = Number(a);
  let rb = bTxt === 'fim' ? Infinity : Number(bTxt);
  if (env) { ra = vale(env, ra); if (rb !== Infinity) rb = vale(env, rb); }
  if (!(rb > ra)) { console.log(`faixa inválida: ${f}`); process.exit(1); }
  cortes = cortes.flatMap(([x, y]) => {
    if (rb <= x || ra >= y) return [[x, y]];
    const r = [];
    if (ra > x) r.push([x, +ra.toFixed(3)]);
    if (rb < y) r.push([+rb.toFixed(3), y]);
    return r;
  }).filter(([x, y]) => y - x > 0.05);
}
plano.cortes = cortes;
await writeFile(planoPath, JSON.stringify(plano, null, 2));
const depois = cortes.reduce((s, [a, b]) => s + b - a, 0);
console.log(`${cortes.length} trechos · ${antes.toFixed(1)}s → ${depois.toFixed(1)}s (−${(antes - depois).toFixed(1)}s)`);
