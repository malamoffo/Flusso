import { JSDOM } from 'jsdom';

const xml = `
<item>
  <title>Test</title>
  <podcast:chapters url="https://example.com/chapters.json" type="application/json+chapters" />
</item>
`;

const dom = new JSDOM(xml, { contentType: 'text/xml' });
const doc = dom.window.document;
const item = doc.querySelector('item');
console.log('XML mode:');
for (const child of item.children) {
  console.log(child.nodeName, child.getAttribute('url'));
}

const domHtml = new JSDOM(xml, { contentType: 'text/html' });
const docHtml = domHtml.window.document;
const itemHtml = docHtml.querySelector('item');
console.log('\nHTML mode:');
for (const child of itemHtml.children) {
  console.log(child.nodeName, child.getAttribute('url'));
}
