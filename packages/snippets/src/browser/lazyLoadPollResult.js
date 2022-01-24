const {poll} = require('@applitools/dom-shared')
const EYES_NAMESPACE = '__EYES__APPLITOOLS__'
const LAZY_LOAD_KEY = 'lazyLoadResult'

function lazyLoadPollResult() {
  return JSON.stringify(poll(window[EYES_NAMESPACE], LAZY_LOAD_KEY))
}

module.exports = lazyLoadPollResult
