import fetch from 'node-fetch';

async function test() {
  const url = 'https://www.pilloledib.it/feed/podcast/';
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  
  try {
    const res = await fetch(proxyUrl);
    const text = await res.text();
    console.log('AllOrigins length:', text.length);
    console.log('Has chapters:', text.includes('podcast:chapters'));
  } catch (e) {
    console.error('AllOrigins error:', e);
  }
}

test();
