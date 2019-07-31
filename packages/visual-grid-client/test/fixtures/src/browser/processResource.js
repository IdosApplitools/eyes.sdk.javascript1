'use strict';
const filterInlineUrl = require('./filterInlineUrl');
const toUnAnchoredUri = require('./toUnAnchoredUri');
const absolutizeUrl = require('./absolutizeUrl');
const makeExtractResourcesFromStyle = require('./extractResourcesFromStyle');

function makeProcessResource({
  fetchUrl,
  findStyleSheetByUrl,
  extractResourcesFromStyleSheet,
  extractResourcesFromSvg,
  cache = {},
}) {
  const extractResourcesFromStyle = makeExtractResourcesFromStyle({extractResourcesFromStyleSheet});
  return function processResource(absoluteUrl, documents, baseUrl, getResourceUrlsAndBlobs) {
    return cache[absoluteUrl] || (cache[absoluteUrl] = doProcessResource(absoluteUrl));

    function doProcessResource(url) {
      return fetchUrl(url)
        .catch(e => {
          if (probablyCORS(e)) {
            return {probablyCORS: true, url};
          } else {
            throw e;
          }
        })
        .then(({url, type, value, probablyCORS}) => {
          if (probablyCORS) {
            return {resourceUrls: [url]};
          }

          let resourceUrls;
          let result = {blobsObj: {[url]: {type, value}}};
          if (/text\/css/.test(type)) {
            const styleSheet = findStyleSheetByUrl(url, documents);
            if (styleSheet) {
              resourceUrls = extractResourcesFromStyle(styleSheet, value, documents[0]);
            }
          } else if (/image\/svg/.test(type)) {
            try {
              resourceUrls = extractResourcesFromSvg(value);
            } catch (e) {
              console.log('could not parse svg content', e);
            }
          }

          if (resourceUrls) {
            resourceUrls = resourceUrls
              .map(toUnAnchoredUri)
              .map(resourceUrl => absolutizeUrl(resourceUrl, url.replace(/^blob:/, '')))
              .filter(filterInlineUrl);
            result = getResourceUrlsAndBlobs(documents, baseUrl, resourceUrls).then(
              ({resourceUrls, blobsObj}) => ({
                resourceUrls,
                blobsObj: Object.assign(blobsObj, {[url]: {type, value}}),
              }),
            );
          }
          return result;
        })
        .catch(err => {
          console.log('[dom-snapshot] error while fetching', url, err);
          return {};
        });
    }

    function probablyCORS(err) {
      const msgCORS =
        err.message &&
        (err.message.includes('Failed to fetch') || err.message.includes('Network request failed'));
      const nameCORS = err.name && err.name.includes('TypeError');
      return msgCORS && nameCORS;
    }
  };
}

module.exports = makeProcessResource;
