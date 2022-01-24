const EYES_NAMESPACE = '__EYES__APPLITOOLS__'
const LAZY_LOAD_KEY = 'lazyLoadResult'
window[EYES_NAMESPACE] = window[EYES_NAMESPACE] || {}

function currentScrollPosition() {
  return {
    x: window.pageXOffset,
    y: document.documentElement.scrollTop,
  }
}

function lazyLoad([scrollLength, waitingTime, pageHeight] = []) {
  if (!scrollLength && waitingTime && pageHeight) return

  try {
    const startingScrollPosition = currentScrollPosition()
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
    window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {}
    const start = Date.now()

    function scrollAndWait(scrollAttempt = 1) {
      if (scrollAttempt > scrollsToAttempt) {
        window.scrollTo(startingScrollPosition.x, startingScrollPosition.y)
        window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {value: log}
        return
      }
      setTimeout(() => {
        window.scrollTo(0, scrollLength * scrollAttempt)
        const {x, y} = currentScrollPosition()
        log.push({
          scrollAttempt,
          x,
          y,
          msSinceStart: Date.now() - start,
        })
        scrollAndWait(scrollAttempt + 1)
      }, waitingTime)
    }

    scrollAndWait()
  } catch (error) {
    window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {error}
    return error
  }
}

module.exports = lazyLoad
