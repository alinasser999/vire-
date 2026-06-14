/* Copy just the web-app files into ./www so Capacitor bundles a clean
   payload (no node_modules / tooling). Used locally and in CI. */
import { cpSync, rmSync, mkdirSync, existsSync } from 'fs';

const WEB = ['index.html', 'manifest.webmanifest', 'sw.js', 'styles', 'src', 'icons'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www', { recursive: true });
for (const item of WEB) {
  if (existsSync(item)) cpSync(item, `www/${item}`, { recursive: true });
}
console.log('Staged web assets →', WEB.join(', '));
