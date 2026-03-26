import fs from 'fs';
try {
  const buffer = fs.readFileSync('android/app/src/main/res/mipmap-mdpi/ic_launcher.png');
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  console.log('Is valid PNG signature:', isPng);
  console.log('File size:', buffer.length);
} catch (e) {
  console.error(e);
}
