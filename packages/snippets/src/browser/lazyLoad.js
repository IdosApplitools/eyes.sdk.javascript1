const EYES_NAMESPACE = '__EYES__APPLITOOLS__'
const LAZY_LOAD_KEY = 'lazyLoadResult'
window[EYES_NAMESPACE] = window[EYES_NAMESPACE] || {}

function lazyLoad([{scrollLength, waitingTime, pageHeight}] = []) {
  if (!scrollLength && waitingTime && pageHeight) return

  try {
    const scrollableHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight
    const targetPageHeight = pageHeight < scrollableHeight ? pageHeight : scrollableHeight
    const scrollsToAttempt = Math.ceil(targetPageHeight / scrollLength)
    const log = [
      {
        targetPageHeight,
        scrollsToAttempt,
        params: {scrollLength, waitingTime, pageHeight},
      },
    ]

    function scrollAndWait(iteration = 1) {
      if (iteration > scrollsToAttempt) {
        window.scrollTo(0, 0)
        window[EYES_NAMESPACE][LAZY_LOAD_KEY] = log
        return
      }
      setTimeout(() => {
        window.scrollTo(0, scrollLength * iteration)
        log.push({iteration, x: window.pageXOffset, y: document.documentElement.scrollTop})
        scrollAndWait(iteration + 1)
      }, waitingTime)
    }

    scrollAndWait()
  } catch (error) {
    return error
  }
}

module.exports = lazyLoad
