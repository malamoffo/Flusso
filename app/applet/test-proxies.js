const url = "https://www.santa-pazienza.it/feed";
const encodedUrl = encodeURIComponent(url);

const proxies = [
  `https://api.allorigins.win/raw?url=${encodedUrl}`,
  `https://corsproxy.io/?${encodedUrl}`,
  `https://corsproxy.org/?url=${encodedUrl}`,
  `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`
];

async function test() {
  for (const proxy of proxies) {
    try {
      console.log(`Testing ${proxy}`);
      const res = await fetch(proxy);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Length: ${text.length}`);
        console.log(`Snippet: ${text.substring(0, 100)}`);
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}
test();
