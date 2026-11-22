const fs = require('fs');
const path = require('path');

try {
  const distDir = path.join(__dirname, '..', 'dist');
  const legacyDir1 = path.join(distDir, 'eventhub');
  const legacyDir2 = path.join(distDir, 'eventhub', 'browser');

  fs.mkdirSync(legacyDir2, { recursive: true });

  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'eventhub') continue;
    const src = path.join(distDir, entry.name);
    const dest = path.join(legacyDir2, entry.name);
    fs.cpSync(src, dest, { recursive: true });
  }

  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    fs.copyFileSync(path.join(distDir, 'index.html'), path.join(legacyDir1, 'index.html'));
  }

  console.log('[Sync] Dist output synced to dist/eventhub/browser for legacy compatibility.');
} catch (e) {
  console.warn('[Sync] Warning during dist sync:', e.message);
}
