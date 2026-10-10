const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

console.log('==> [Render/Build Hook] Installing server dependencies...');
execSync('npm install --include=dev', { cwd: serverDir, stdio: 'inherit' });

console.log('==> [Render/Build Hook] Installing client dependencies (including Vite)...');
execSync('npm install --include=dev', { cwd: clientDir, stdio: 'inherit' });

console.log('==> [Render/Build Hook] Building React production frontend...');
execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

console.log('==> [Render/Build Hook] Build completed successfully!');
