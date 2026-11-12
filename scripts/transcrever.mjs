/* Transcreve o bruto com tempo de cada palavra (whisper.cpp, local e gratuito).
   Uso:  npm run transcrever -- <nome>
   Gera:
     projetos/<nome>/transcricao.json  palavras [{t, f, texto}] em segundos do bruto
     projetos/<nome>/transcricao.txt   texto legível, uma frase por linha com [tempo]
   e preenche plano.legendas (se estiver vazio).
   Pré-requisito: `npm run instalar` uma vez por computador. */
import { transcribe, toCaptions } from '@remotion/install-whisper-cpp';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { WHISPER } from './config.mjs';

const nome = process.argv[2];
if (!nome) { console.log('uso: npm run transcrever -- <nome>'); process.exit(1); }
const dir = path.join('projetos', nome);
const planoPath = path.join(dir, 'plano.json');
const plano = JSON.parse(await readFile(planoPath, 'utf8'));
const bruto = path.join(dir, plano.video);

try { await access(path.resolve(WHISPER.pasta)); } catch {
  console.log('whisper ainda não instalado — rode `npm run instalar` (uma vez).'); process.exit(1);
}

await mkdir(path.join(dir, '_cache'), { recursive: true });
const wav = path.join(dir, '_cache', 'audio16k.wav');
// whisper exige WAV 16 kHz mono; o ffmpeg vem junto com o Remotion
execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-i', bruto, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], { stdio: 'inherit' });

const json = await transcribe({
  inputPath: path.resolve(wav),
  whisperPath: path.resolve(WHISPER.pasta),
  whisperCppVersion: WHISPER.versao,
  model: WHISPER.modelo,
  tokenLevelTimestamps: true,
  language: 'pt',
  splitOnWord: true,
  printOutput: false,
  onProgress: (p) => process.stdout.write(`\rtranscrevendo ${(p * 100).toFixed(0)}%`),
});
const { captions } = toCaptions({ whisperCppOutput: json });
const palavras = captions
  .map((c) => ({ t: +(c.startMs / 1000).toFixed(3), f: +(c.endMs / 1000).toFixed(3), texto: c.text.trim() }))
  .filter((p) => p.texto);

await writeFile(path.join(dir, 'transcricao.json'), JSON.stringify(palavras, null, 1));

// versão legível: quebra em frases
const linhas = [];
let atual = [];
for (const p of palavras) {
  atual.push(p);
  if (/[.!?…]$/.test(p.texto)) { linhas.push(atual); atual = []; }
}
if (atual.length) linhas.push(atual);
const txt = linhas.map((l) => `[${l[0].t.toFixed(2)}–${l[l.length - 1].f.toFixed(2)}] ${l.map((p) => p.texto).join(' ')}`).join('\n');
await writeFile(path.join(dir, 'transcricao.txt'), txt + '\n');

if (!plano.legendas?.length) {
  plano.legendas = palavras;
  await writeFile(planoPath, JSON.stringify(plano, null, 2));
}
console.log(`\n${palavras.length} palavras → ${dir}/transcricao.txt`);
