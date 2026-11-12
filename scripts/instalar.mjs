/* Instala o whisper.cpp (transcrição local, gratuita, sem enviar áudio para fora)
   e baixa o modelo. Roda UMA vez por computador: `npm run instalar`.
   Tudo fica em .whisper/ (fora do git). */
import { installWhisperCpp, downloadWhisperModel } from '@remotion/install-whisper-cpp';
import path from 'node:path';
import { WHISPER } from './config.mjs';

const to = path.resolve(WHISPER.pasta);
await installWhisperCpp({ to, version: WHISPER.versao });
await downloadWhisperModel({ folder: to, model: WHISPER.modelo });
console.log(`\nPronto: whisper.cpp ${WHISPER.versao} + modelo "${WHISPER.modelo}" em ${to}`);
