const EYES_NAMESPACE = '__EYES__APPLITOOLS__'
const LAZY_LOAD_KEY = 'lazyLoadResult'

function lazyLoadPollResult() {
  const result = window[EYES_NAMESPACE][LAZY_LOAD_KEY]
  if (!result) return {status: 'WIP'}
  window[EYES_NAMESPACE][LAZY_LOAD_KEY] = null
  return result
}

module.exports = lazyLoadPollResult
