const getDocumentSize = require('./getDocumentSize')

function lazyLoad([{scrollLength, waitingTime, pageHeight} = {}] = []) {
  if (!scrollLength && waitingTime && pageHeight) return

  const {height: actualPageHeight} = getDocumentSize()
  const preferredPageHeight = pageHeight < actualPageHeight ? pageHeight : actualPageHeight
  const scrollsToAttempt = Math.ceil(preferredPageHeight / scrollLength)
  const log = [
    {
      preferredPageHeight,
      scrollsToAttempt,
      params: {scrollLength, waitingTime, pageHeight},
    },
  ]
  let p = Promise.resolve()

  for (let i = 0; i < scrollsToAttempt; i++) {
    p = p.then(() => {
      window.scrollTo({top: scrollLength * (i + 1)})
      log.push({
        scrollIndex: i,
        x: window.scrollX,
        y: window.scrollY,
      })
      return new Promise(resolve => setTimeout(resolve, waitingTime))
    })
  }

  return p.then(() => {
    window.scrollTo({top: 0})
    return log
  })
}

module.exports = lazyLoad
