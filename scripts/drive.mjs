/* DRIVE — baixa uma pasta (ou um arquivo) do Google Drive só com o link.
   A pasta precisa estar compartilhada como "Qualquer pessoa com o link".

   Uso:
     npm run fotos  -- <link da pasta de fotos>     → _banco-thais/original + _banco-thais/jpg
     npm run baixar -- <link da pasta ou arquivo>   → _entrada/ (vídeos brutos)

   As fotos são convertidas para JPG (HEIC/HEIF/PNG do iPhone → JPG, lado maior
   2000 px) com o `sips` do macOS. Arquivo que já existe não é baixado de novo.
   Nada disso vai para o GitHub (.gitignore). */
import { mkdir, writeFile, stat, rename } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const fotos = process.argv.includes('--fotos');
const link = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!link) {
  console.log(fotos ? 'uso: npm run fotos -- <link da pasta do Drive>' : 'uso: npm run baixar -- <link da pasta ou do arquivo no Drive>');
  process.exit(1);
}

const idPasta = link.match(/folders\/([A-Za-z0-9_-]+)/)?.[1];
const idArquivo = link.match(/(?:file\/d\/|[?&]id=)([A-Za-z0-9_-]+)/)?.[1];
if (!idPasta && !idArquivo) { console.log('não reconheci o link do Drive. Use o link de compartilhamento da pasta ou do arquivo.'); process.exit(1); }

const destino = fotos ? path.join('_banco-thais', 'original') : '_entrada';
await mkdir(destino, { recursive: true });

/* 1. lista os arquivos (a visão "embutida" da pasta funciona sem login) */
let itens = [];
if (idPasta) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${idPasta}`);
  const html = await r.text();
  if (!r.ok || !html.includes('flip-entry')) {
    console.log('não consegui ler a pasta. Confira se ela está compartilhada como "Qualquer pessoa com o link".');
    process.exit(1);
  }
  const re = /id="entry-([A-Za-z0-9_-]+)"[\s\S]*?flip-entry-title">([^<]+)</g;
  for (let m; (m = re.exec(html)); ) itens.push({ id: m[1], nome: m[2].trim() });
  // subpasta aparece com link /folders/ — ignora (só arquivos)
  itens = itens.filter((it) => !html.includes(`folders/${it.id}`));
} else {
  itens = [{ id: idArquivo, nome: null }];
}
if (!itens.length) { console.log('a pasta está vazia (ou só tem subpastas).'); process.exit(1); }
console.log(`${itens.length} arquivo(s) → ${destino}/`);

/* 2. baixa */
const limpa = (s) => s.replace(/[\/\\:*?"<>|]/g, '_');
let baixados = 0, pulados = 0, falhas = 0;
for (const [i, it] of itens.entries()) {
  const url = `https://drive.usercontent.google.com/download?id=${it.id}&export=download&confirm=t`;
  for (let tentativa = 1; tentativa <= 3; tentativa++) try {
    const r = await fetch(url);
    if (!r.ok || (r.headers.get('content-type') ?? '').includes('text/html')) throw new Error(`HTTP ${r.status} — arquivo não está público?`);
    const nomeHeader = r.headers.get('content-disposition')?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i)?.[1];
    const nome = limpa(it.nome ?? (nomeHeader ? decodeURIComponent(nomeHeader) : `${it.id}.bin`));
    let arq = path.join(destino, nome);
    const tamanho = Number(r.headers.get('content-length') ?? 0);
    if (existsSync(arq)) {
      // mesmo nome e mesmo tamanho = mesmo arquivo; tamanho diferente = outro arquivo com nome repetido
      const igual = !tamanho || (await stat(arq)).size === tamanho;
      if (!igual) arq = arq.replace(/(\.[^.]+)?$/, (ext) => `_${it.id.slice(0, 6)}${ext}`);
      if (igual || existsSync(arq)) { pulados++; await r.body?.cancel(); break; }
    }
    // baixa num .parcial e só renomeia no fim: queda de rede não deixa arquivo pela metade
    await pipeline(Readable.fromWeb(r.body), createWriteStream(arq + '.parcial'));
    await rename(arq + '.parcial', arq);
    baixados++;
    console.log(`  ${i + 1}/${itens.length}  ${path.basename(arq)}${tamanho ? `  (${(tamanho / 1e6).toFixed(1)} MB)` : ''}`);
    break;
  } catch (e) {
    if (tentativa < 3) { await new Promise((ok) => setTimeout(ok, 2000 * tentativa)); continue; }
    falhas++;
    console.log(`  ${i + 1}/${itens.length}  FALHOU ${it.nome ?? it.id}: ${e.message} (rode de novo: o que já baixou é pulado)`);
  }
}
console.log(`baixados ${baixados} · já existiam ${pulados}${falhas ? ` · falharam ${falhas}` : ''}`);

/* 3. fotos → JPG */
if (fotos) {
  const jpg = path.join('_banco-thais', 'jpg');
  await mkdir(jpg, { recursive: true });
  const { readdir } = await import('node:fs/promises');
  let convertidas = 0;
  for (const f of await readdir(destino)) {
    if (!/\.(jpe?g|png|heic|heif|webp|tiff?)$/i.test(f)) continue;
    const saida = path.join(jpg, f.replace(/\.[^.]+$/, '') + '.jpg');
    if (existsSync(saida)) continue;
    try {
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', '-Z', '2000', path.join(destino, f), '--out', saida], { stdio: 'ignore' });
      convertidas++;
    } catch { console.log(`  não converti ${f}`); }
  }
  await writeFile(path.join('_banco-thais', 'LEIA.txt'),
    'Fotos da Thaís para usar como B-roll. jpg/ = versão leve para o vídeo; original/ = como veio do Drive.\n' +
    'O Claude escolhe olhando as fotos (academia, antes/depois, pilates, notebook, lifestyle).\n');
  console.log(`${convertidas} foto(s) convertida(s) para JPG em ${jpg}/`);
}
