import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === 'win32';
const shell = isWin ? (process.env.ComSpec || 'cmd.exe') : 'bash';
const script = join(__dirname, isWin ? 'play-sound.bat' : 'play-sound.sh');
const args = isWin ? ['/d', '/s', '/c', script] : [script];

spawnSync(shell, args, { stdio: 'ignore', windowsHide: true });
process.exit(0);
