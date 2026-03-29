import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

async function run() {
  const res = await fetch('https://pagineromaniste.com/wesley-ko-in-nazionale-rientro-nella-capitale-e-controlli-previsti/');
  const html = await res.text();
  const doc = new JSDOM(html, { url: 'https://pagineromaniste.com/wesley-ko-in-nazionale-rientro-nella-capitale-e-controlli-previsti/' });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();
  console.log(article.content);
}

run();
