import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Generating icons with @capacitor/assets...');
try {
  execSync('npx @capacitor/assets generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to generate icons:', e);
  process.exit(1);
}

const sourceDir = path.join(process.cwd(), 'icons');
const destDir = path.join(process.cwd(), 'public', 'icons');

if (fs.existsSync(sourceDir)) {
  console.log('Moving PWA icons to public/icons...');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
  }
  console.log('Icons moved successfully.');
} else {
  console.log('No PWA icons generated.');
}
