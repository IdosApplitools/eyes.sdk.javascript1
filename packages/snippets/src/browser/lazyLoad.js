const EYES_NAMESPACE = '__EYES__APPLITOOLS__'
const LAZY_LOAD_KEY = 'lazyLoadResult'
window[EYES_NAMESPACE] = window[EYES_NAMESPACE] || {}
const lazyLoadPollResult = require('./lazyLoadPollResult')
const currentScrollPosition = require('./getElementScrollOffset')

function lazyLoad([{scrollLength, waitingTime, pageHeight} = {}] = []) {
  try {
    const startingScrollPosition = currentScrollPosition()
    const scrollableHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight
    const targetPageHeight = pageHeight < scrollableHeight ? pageHeight : scrollableHeight
    const scrollsToAttempt = Math.ceil(targetPageHeight / scrollLength)
    const log = [
      {
        userProvidedPageHeight: pageHeight,
        targetPageHeight,
        scrollsToAttempt,
        startingScrollPositionX: startingScrollPosition.x,
        startingScrollPositionY: startingScrollPosition.y,
      },
    ]
    window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {}
    const start = Date.now()

    function scrollAndWait(scrollAttempt = 1) {
      setTimeout(() => {
        try {
          if (scrollAttempt > scrollsToAttempt) {
            window.scrollTo(startingScrollPosition.x, startingScrollPosition.y)
            const {x, y} = currentScrollPosition()
            log.push({
              scrollAttempt,
              x,
              y,
              msSinceStart: Date.now() - start,
            })
            window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {value: log}
            return
          }
          window.scrollTo(startingScrollPosition.x, scrollLength * scrollAttempt)
          const {x, y} = currentScrollPosition()
          log.push({
            scrollAttempt,
            x,
            y,
            msSinceStart: Date.now() - start,
            scrollLength,
            waitingTime,
          })
          scrollAndWait(scrollAttempt + 1)
        } catch (error) {
          window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {status: 'ERROR', error}
        }
      }, waitingTime)
    }

    scrollAndWait()
    return lazyLoadPollResult()
  } catch (error) {
    window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {status: 'ERROR', error}
    return error
  }
}

module.exports = lazyLoad
