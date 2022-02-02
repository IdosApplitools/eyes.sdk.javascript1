const EYES_NAMESPACE = '__EYES__APPLITOOLS__'
const LAZY_LOAD_KEY = 'lazyLoadResult'
window[EYES_NAMESPACE] = window[EYES_NAMESPACE] || {}
const currentScrollPosition = require('./getElementScrollOffset')
const scrollTo = require('./scrollTo')

function lazyLoad([{scrollLength, waitingTime, pageHeight} = {}] = []) {
  if (window[EYES_NAMESPACE][LAZY_LOAD_KEY]) {
    const state = window[EYES_NAMESPACE][LAZY_LOAD_KEY]
    if (state.status !== 'WIP') delete window[EYES_NAMESPACE][LAZY_LOAD_KEY]
    return JSON.stringify(state)
  } else {
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
      window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {status: 'WIP'}
      const start = Date.now()

      function scrollAndWait(scrollAttempt = 1) {
        setTimeout(() => {
          try {
            if (scrollAttempt > scrollsToAttempt) {
              const {x, y} = scrollTo([undefined, startingScrollPosition])
              log.push({
                scrollAttempt,
                x,
                y,
                msSinceStart: Date.now() - start,
              })
              window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {value: log}
              return
            }
            const {x, y} = scrollTo([
              undefined,
              {
                x: startingScrollPosition.x,
                y: scrollLength * scrollAttempt,
              },
            ])
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
      return JSON.stringify(window[EYES_NAMESPACE][LAZY_LOAD_KEY])
    } catch (error) {
      window[EYES_NAMESPACE][LAZY_LOAD_KEY] = {status: 'ERROR', error}
      return error
    }
  }
}

module.exports = lazyLoad
