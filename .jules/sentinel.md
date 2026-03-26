# Sentinel's Security Journal - Flusso

## 2025-05-22 - XSS and XML Injection in RSS/OPML processing
**Vulnerability:** Use of `innerHTML` on a `textarea` element for HTML entity decoding and lack of XML escaping in OPML export.
**Learning:** Even "safer" elements like `textarea` can be a liability when used with `innerHTML` for decoding. Furthermore, simple string replacement for quotes in XML attributes is insufficient for preventing XML injection or ensuring data integrity when dealing with arbitrary feed titles and URLs.
**Prevention:** Always use `DOMParser` with `textContent` for HTML entity decoding. Implement a comprehensive `escapeXml` function for all user-controlled data when generating XML/OPML exports.
