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
    const start = Date.now()

    function scrollAndWait(scrollAttempt = 1) {
      if (scrollAttempt > scrollsToAttempt) {
        window.scrollTo(0, 0)
        window[EYES_NAMESPACE][LAZY_LOAD_KEY] = log
        return
      }
      setTimeout(() => {
        window.scrollTo(0, scrollLength * scrollAttempt)
        log.push({
          scrollAttempt,
          x: window.pageXOffset,
          y: document.documentElement.scrollTop,
          msSinceStart: Date.now() - start,
        })
        scrollAndWait(scrollAttempt + 1)
      }, waitingTime)
    }

    scrollAndWait()
  } catch (error) {
    return error
  }
}

module.exports = lazyLoad
