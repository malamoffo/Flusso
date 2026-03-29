const https = require('https');

https.get('https://pagineromaniste.com/feed/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(0, 5000));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
