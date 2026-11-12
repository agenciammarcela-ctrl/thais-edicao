/* Abre o Remotion Studio (editor visual no navegador) com um projeto.
   Uso:  npm run studio -- <nome>
   Dá para dar play, arrastar a agulha e ver cada camada. Mudanças no
   plano.json aparecem ao salvar. */
import { spawn } from 'node:child_process';
import path from 'node:path';

const nome = process.argv[2];
if (!nome) { console.log('uso: npm run studio -- <nome>'); process.exit(1); }
const dir = path.join('projetos', nome);
spawn('npx', ['remotion', 'studio', 'src/index.ts', `--props=${path.join(dir, 'plano.json')}`, `--public-dir=${dir}`], { stdio: 'inherit' });
