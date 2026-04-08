import { execSync } from 'child_process';
console.log('Generating assets...');
try {
  execSync('npx @capacitor/assets generate', { stdio: 'inherit' });
  console.log('Assets generated successfully.');
} catch (error) {
  console.error('Failed to generate assets:', error);
  process.exit(1);
}
