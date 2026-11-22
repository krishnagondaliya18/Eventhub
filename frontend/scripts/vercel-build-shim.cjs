const fs = require('fs');
const path = require('path');

try {
  const angularCliDir = path.join(__dirname, '..', 'node_modules', '@angular', 'cli');
  const binDir = path.join(angularCliDir, 'bin');

  fs.mkdirSync(binDir, { recursive: true });

  // package.json for @angular/cli
  fs.writeFileSync(
    path.join(angularCliDir, 'package.json'),
    JSON.stringify({ name: '@angular/cli', version: '17.3.0', type: 'commonjs' }, null, 2),
    'utf8'
  );

  const ngContent = `#!/usr/bin/env node
const { execSync } = require('child_process');
console.log('[Vercel Shim] Intercepted legacy Angular CLI build command. Executing Vite production build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (err) {
  process.exit(err.status || 1);
}
`;

  fs.writeFileSync(path.join(binDir, 'ng'), ngContent, 'utf8');
  fs.writeFileSync(path.join(binDir, 'ng.js'), ngContent, 'utf8');

  // Try making it executable on Unix systems
  try {
    fs.chmodSync(path.join(binDir, 'ng'), 0o755);
  } catch {}

  console.log('[Vercel Shim] Successfully registered Angular CLI build shim.');
} catch (err) {
  console.warn('[Vercel Shim] Warning creating shim:', err.message);
}
