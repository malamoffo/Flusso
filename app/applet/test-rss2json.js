const url = "https://www.santa-pazienza.it/feed";
fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
  .then(r => r.json())
  .then(console.log);
