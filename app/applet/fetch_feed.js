const https = require('https');

https.get('https://www.pilloledib.it/feed/podcast/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    if (data.length > 50000) {
      res.destroy();
      const match = data.match(/<podcast:chapters[^>]*>/g);
      console.log("Matches:", match);
    }
  });
}).on('error', (err) => {
  console.error(err);
});
