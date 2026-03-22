export async function fetchWithProxy(url: string, isRss: boolean = true): Promise<string> {
  // First try direct fetch (in case CORS is enabled on the target server)
  try {
    const directResponse = await fetch(url, {
      headers: isRss ? { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } : {}
    });
    if (directResponse.ok) {
      const text = await directResponse.text();
      if (isRss) {
        if (text && text.trim().length > 0 && (text.includes('<rss') || text.includes('<feed') || text.includes('<?xml') || text.includes('<rdf:RDF'))) {
          return text;
        }
      } else {
        return text;
      }
    }
  } catch (e) {
    // Direct fetch failed (likely CORS), fallback to proxies
  }

  const proxies = [
    { url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, type: 'json' },
    { url: `https://corsproxy.io/?${encodeURIComponent(url)}`, type: 'text' },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, type: 'text' }
  ];

  if (isRss) {
    proxies.push({ url: `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, type: 'rss2json' });
  }

  let lastError: any;
  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy.url);
      if (response.ok) {
        let text = '';
        if (proxy.type === 'json') {
          const data = await response.json();
          text = data.contents || '';
        } else if (proxy.type === 'rss2json') {
          const data = await response.json();
          if (data.status === 'ok') {
            return JSON.stringify(data); // Return the JSON string, parseRssXml will handle it
          } else {
            lastError = new Error(`rss2json returned error: ${data.message}`);
            continue;
          }
        } else {
          text = await response.text();
        }
        
        if (text && text.trim().length > 0) {
          if (isRss) {
            if (text.includes('<rss') || text.includes('<feed') || text.includes('<?xml') || text.includes('<rdf:RDF')) {
              return text;
            } else {
              lastError = new Error(`Proxy returned invalid content (not XML/RSS)`);
              continue;
            }
          } else {
            return text;
          }
        } else {
          lastError = new Error(`Proxy returned empty response`);
          continue;
        }
      }
      lastError = new Error(`Proxy returned status ${response.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Failed to fetch from all proxies.');
}
