function lazyLoad([{scrollLength, waitingTime, pageHeight} = {}] = []) {
  if (!scrollLength && waitingTime && pageHeight) return

  try {
    const scrollableHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight
    const preferredPageHeight = pageHeight < scrollableHeight ? pageHeight : scrollableHeight
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
        window.scrollTo(0, scrollLength * (i + 1))
        log.push({
          scrollIndex: i,
          x: window.scrollX,
          y: window.scrollY,
        })
        return new Promise(resolve => setTimeout(resolve, waitingTime))
      })
    }

    return p.then(() => {
      window.scrollTo(0, 0)
      return log
    })
  } catch (error) {
    return error
  }
}

module.exports = lazyLoad
