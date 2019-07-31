'use strict';
const getUrlFromCssText = require('./getUrlFromCssText');
const flat = require('./flat');

function makeExtractResourcesFromSvg({parser, decoder, extractResourceUrlsFromStyleTags}) {
  return function(svgArrayBuffer) {
    const decooder = decoder || new TextDecoder('utf-8');
    const svgStr = decooder.decode(svgArrayBuffer);
    const domparser = parser || new DOMParser();
    const doc = domparser.parseFromString(svgStr, 'image/svg+xml');

    const fromImages = Array.from(doc.getElementsByTagName('image'))
      .concat(Array.from(doc.getElementsByTagName('use')))
      .map(e => e.getAttribute('href') || e.getAttribute('xlink:href'));
    const fromObjects = Array.from(doc.getElementsByTagName('object')).map(e =>
      e.getAttribute('data'),
    );
    const fromStyleTags = extractResourceUrlsFromStyleTags(doc, false);
    const fromStyleAttrs = urlsFromStyleAttrOfDoc(doc);

    return fromImages
      .concat(fromObjects)
      .concat(fromStyleTags)
      .concat(fromStyleAttrs)
      .filter(u => u[0] !== '#');
  };
}

function urlsFromStyleAttrOfDoc(doc) {
  return flat(
    Array.from(doc.querySelectorAll('*[style]'))
      .map(e => e.style.cssText)
      .map(getUrlFromCssText)
      .filter(Boolean),
  );
}

module.exports = makeExtractResourcesFromSvg;
