const utils = require('@applitools/utils')
const snippets = require('@applitools/snippets')
const findImagePattern = require('./find-image-pattern')
const makeImage = require('./image')

function makeTakeViewportScreenshot(options) {
  const {driver} = options
  if (driver.isNative) {
    return makeTakeNativeScreenshot(options)
  } else if (driver.isIOS) {
    // safari on ios takes screenshot with browser and os interfaces
    return makeTakeMarkedScreenshot(options)
  } else if (driver.browserName === 'Firefox') {
    try {
      const browserVersion = Number.parseInt(driver.browserVersion, 10)
      if (browserVersion >= 48 && browserVersion <= 72) {
        // firefox between versions 48 and 72 takes current frame screenshot only
        return makeTakeMainContextScreenshot(options)
      }
    } catch (ignored) {}
  } else if (driver.browserName === 'Safari' && driver.browserVersion === '11') {
    // safari 11 on macs takes full page screenshot
    return makeTakeSafari11Screenshot(options)
  }

  return makeTakeDefaultScreenshot(options)
}

function makeTakeDefaultScreenshot({driver, stabilization = {}, debug, logger}) {
  return async function takeScreenshot({name} = {}) {
    logger.verbose('Taking screenshot...')
    const image = makeImage(await driver.takeScreenshot())
    await image.debug({...debug, name, suffix: 'original'})

    if (stabilization.scale) image.scale(stabilization.scale)
    else image.scale(1 / driver.pixelRatio / driver.viewportScale)

    if (stabilization.rotate) image.crop(stabilization.rotate)

    if (stabilization.crop) image.crop(stabilization.crop)

    return image
  }
}

function makeTakeMainContextScreenshot({driver, stabilization = {}, debug, logger}) {
  return async function takeScreenshot({name} = {}) {
    logger.verbose('Taking screenshot...')
    const originalContext = driver.currentContext
    await driver.mainContext.focus()
    const image = makeImage(await driver.takeScreenshot())
    await originalContext.focus()
    await image.debug({...debug, name, suffix: 'original'})

    if (stabilization.scale) image.scale(stabilization.scale)
    else image.scale(1 / driver.pixelRatio / driver.viewportScale)

    if (stabilization.rotate) image.rotate(stabilization.rotate)

    if (stabilization.crop) image.crop(stabilization.crop)

    return image
  }
}

function makeTakeSafari11Screenshot({driver, stabilization = {}, debug, logger}) {
  let viewportSize

  return async function takeScreenshot({name} = {}) {
    logger.verbose('Taking safari 11 driver screenshot...')
    const image = makeImage(await driver.takeScreenshot())
    await image.debug({...debug, name, suffix: 'original'})

    if (stabilization.scale) image.scale(stabilization.scale)
    else image.scale(1 / driver.pixelRatio / driver.viewportScale)

    if (stabilization.rotate) image.rotate(stabilization.rotate)

    if (stabilization.crop) image.crop(stabilization.crop)
    else {
      if (!viewportSize) viewportSize = await driver.getViewportSize()
      const viewportLocation = await driver.mainContext.execute(snippets.getElementScrollOffset, [])
      image.crop(utils.geometry.region(viewportLocation, viewportSize))
    }

    return image
  }
}

function makeTakeMarkedScreenshot({driver, stabilization = {}, debug, logger}) {
  let viewportRegion

  return async function takeScreenshot({name} = {}) {
    logger.verbose('Taking viewport screenshot (using markers)...')
    const image = makeImage(await driver.takeScreenshot())
    await image.debug({...debug, name, suffix: 'original'})

    if (stabilization.scale) image.scale(stabilization.scale)
    else image.scale(1 / driver.pixelRatio / driver.viewportScale)

    if (stabilization.rotate) image.rotate(stabilization.rotate)
    else if (driver.orientation === 'landscape' && image.width < image.height) image.rotate(-90)

    if (stabilization.crop) image.crop(stabilization.crop)
    else {
      if (!viewportRegion) viewportRegion = await getViewportRegion()
      if (viewportRegion) image.crop(viewportRegion)
    }

    await image.debug({...debug, name, suffix: 'viewport'})

    return image
  }

  async function getViewportRegion() {
    // marker is -> bwb bwbb wbw bwbb wbww bbb
    const marker = await driver.mainContext.execute(snippets.addPageMarker, [
      {
        mask: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1],
        size: utils.math.multiplier(driver.viewportScale * driver.pixelRatio, 0.05),
      },
    ])
    await utils.general.sleep(100)

    try {
      const image = makeImage(await driver.takeScreenshot())

      if (stabilization.rotate) image.rotate(stabilization.rotate)
      else if (driver.orientation === 'landscape' && image.width < image.height) image.rotate(-90)

      await image.debug({...debug, name: 'marker'})

      const markerLocation = findImagePattern(await image.toObject(), {
        ...marker,
        scale: driver.viewportScale * driver.pixelRatio,
      })
      if (!markerLocation) return null

      return utils.geometry.region(
        utils.geometry.scale(markerLocation, 1 / driver.pixelRatio / driver.viewportScale),
        await driver.getViewportSize(),
      )
    } finally {
      await driver.mainContext.execute(snippets.cleanupPageMarker)
    }
  }
}

function makeTakeNativeScreenshot({driver, stabilization = {}, debug, logger}) {
  return async function takeScreenshot({name, withStatusBar} = {}) {
    logger.verbose('Taking native driver screenshot...')
    const image = makeImage(await driver.takeScreenshot())
    await image.debug({...debug, name, suffix: 'original'})

    if (stabilization.scale) image.scale(stabilization.scale)
    else image.scale(1 / driver.pixelRatio / driver.viewportScale)

    if (stabilization.rotate) image.rotate(stabilization.rotate)
    else if (driver.orientation === 'landscape' && image.width < image.height) image.rotate(-90)

    if (stabilization.crop) image.crop(stabilization.crop)
    else {
      const viewportSize = await driver.getViewportSize()
      if (withStatusBar) {
        image.crop({x: 0, y: 0, width: viewportSize.width, height: viewportSize.height + driver.statusBarHeight})
      } else if (driver.isAndroid && driver.orientation === 'landscape') {
        image.crop({
          top: driver.statusBarHeight,
          bottom: driver.orientation === 'landscape' ? 0 : driver.navigationBarHeight,
          left: driver.platformVersion >= 8 ? driver.navigationBarHeight : 0,
          right: driver.platformVersion < 8 ? driver.navigationBarHeight : 0,
        })
      } else {
        image.crop({x: 0, y: driver.statusBarHeight, width: viewportSize.width, height: viewportSize.height})
      }
    }

    await image.debug({...debug, name, suffix: `viewport${withStatusBar ? '-with-statusbar' : ''}`})

    return image
  }
}

module.exports = makeTakeViewportScreenshot
