const utils = require('@applitools/utils')
const makeImage = require('./image')
const makeTakeScreenshot = require('./take-screenshot')

async function takeStitchedScreenshot({
  logger,
  context,
  scroller,
  region,
  overlap = 50,
  framed,
  wait,
  stabilization,
  debug,
}) {
  logger.verbose('Taking full image of...')

  const scrollerRegion = utils.geometry.region({x: 0, y: 0}, await scroller.getContentSize())
  logger.verbose(`Scroller size: ${scrollerRegion}`)

  const driver = context.driver
  const takeScreenshot = makeTakeScreenshot({logger, driver, stabilization, debug})

  const initialOffset = region ? utils.geometry.location(region) : {x: 0, y: 0}
  const actualOffset = await scroller.moveTo(initialOffset)
  const expectedRemainingOffset = utils.geometry.offsetNegative(initialOffset, actualOffset)

  await utils.general.sleep(wait)

  logger.verbose('Getting initial image...')
  let image = await takeScreenshot({name: 'initial'})
  const firstImage = framed ? makeImage(image) : null

  const targetRegion = region || (await scroller.getClientRegion())

  // TODO the solution should not check driver specifics,
  // in this case target region coordinate should be already related to the scrolling element of the context
  const cropRegion = driver.isNative ? targetRegion : await driver.getRegionInViewport(context, targetRegion)

  logger.verbose('cropping...')
  image.crop(cropRegion)
  await image.debug({...debug, name: 'initial', suffix: 'region'})

  if (region) region = utils.geometry.intersect(region, scrollerRegion)
  else region = scrollerRegion

  region = {
    x: Math.round(region.x),
    y: Math.round(region.y),
    width: Math.round(region.width),
    height: Math.round(region.height),
  }

  // TODO padding should be provided from args instead of overlap
  const padding = {top: overlap, bottom: overlap}
  const [initialRegion, ...partRegions] = utils.geometry.divide(region, image.size, padding)
  logger.verbose('Part regions', partRegions)

  logger.verbose('Creating stitched image composition container')
  const composition = makeImage({width: region.width, height: region.height})

  logger.verbose('Adding initial image...')
  await composition.copy(image, {x: 0, y: 0})

  logger.verbose('Getting the rest of the image parts...')

  let stitchedSize = {width: image.width, height: image.height}
  let lastImage
  for (const partRegion of partRegions) {
    const partName = `${partRegion.x}_${partRegion.y}_${partRegion.width}x${partRegion.height}`
    logger.verbose(`Processing part ${partName}`)

    const compensateOffset = {x: 0, y: initialRegion.y !== partRegion.y ? padding.top : 0}
    const partOffset = utils.geometry.location(partRegion)
    const requiredOffset = utils.geometry.offsetNegative(partOffset, compensateOffset)

    logger.verbose(`Move to ${requiredOffset}`)
    const actualOffset = await scroller.moveTo(requiredOffset)
    const remainingOffset = utils.geometry.offset(
      utils.geometry.offsetNegative(
        utils.geometry.offsetNegative(requiredOffset, actualOffset),
        expectedRemainingOffset,
      ),
      compensateOffset,
    )
    const cropPartRegion = {
      x: cropRegion.x + remainingOffset.x,
      y: cropRegion.y + remainingOffset.y,
      width: partRegion.width,
      height: partRegion.height,
    }
    logger.verbose(`Actual offset is ${actualOffset}, remaining offset is ${remainingOffset}`)

    await utils.general.sleep(wait)

    // TODO maybe remove
    if (utils.geometry.isEmpty(cropPartRegion)) continue

    logger.verbose('Getting image...')
    image = await takeScreenshot({name: partName})
    lastImage = framed ? makeImage(image) : null

    logger.verbose('cropping...')
    image.crop(cropPartRegion)
    await image.debug({...debug, name: partName, suffix: 'region'})

    await composition.copy(image, utils.geometry.offsetNegative(partOffset, initialOffset))

    stitchedSize = {width: partOffset.x + image.width, height: partOffset.y + image.height}
  }

  logger.verbose(`Extracted entire size: ${region}`)
  logger.verbose(`Actual stitched size: ${stitchedSize}`)

  if (stitchedSize.width < composition.width || stitchedSize.height < composition.height) {
    logger.verbose('Trimming unnecessary margins...')
    composition.crop({
      x: 0,
      y: 0,
      width: Math.min(stitchedSize.width, composition.width),
      height: Math.min(stitchedSize.height, composition.height),
    })
  }

  await composition.debug({...debug, name: 'stitched'})

  if (framed) {
    await composition.combine(firstImage, lastImage, cropRegion)
    await composition.debug({...debug, name: 'framed'})

    return {
      image: composition,
      region: utils.geometry.region({x: 0, y: 0}, composition.size),
    }
  } else {
    return {
      image: composition,
      region: utils.geometry.region(cropRegion, composition.size),
    }
  }
}

module.exports = takeStitchedScreenshot
