import https from 'https';

https.get('https://api.rss2json.com/v1/api.json?rss_url=https://pagineromaniste.com/feed/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(json.items[1].content);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
