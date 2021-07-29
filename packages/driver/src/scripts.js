const utils = require('@applitools/utils')
const snippets = require('@applitools/snippets')

async function getViewportSize({driver}) {
  return driver.mainContext.execute(snippets.getViewportSize)
}

async function setViewportSize({driver, size, logger}) {
  // First we will set the window size to the required size.
  // Then we'll check the viewport size and increase the window size accordingly.
  const requiredViewportSize = size
  logger.verbose(`setViewportSize(${requiredViewportSize})`)

  let actualViewportSize = await driver.getViewportSize()
  logger.verbose(`Initial viewport size: ${actualViewportSize}`)
  // If the viewport size is already the required size
  if (utils.geometry.equals(actualViewportSize, requiredViewportSize)) return true

  let actualWindowSize = await context.driver.getWindowSize()
  actualViewportSize = await driver.getViewportSize()
  logger.verbose(`actualWindowSize: ${actualWindowSize}, actualViewportSize: ${actualViewportSize}`)

  const sleep = 3000
  let retries = 3

  while (retries >= 0) {
    const requiredWindowSize = {
      width: actualWindowSize.width + (requiredViewportSize.width - actualViewportSize.width),
      height: actualWindowSize.height + (requiredViewportSize.height - actualViewportSize.height),
    }
    logger.verbose(`Attempt to set window size to ${requiredWindowSize}. Retries left: ${retries}`)
    await context.driver.setWindowSize(requiredWindowSize)
    await utils.general.sleep(sleep)
    actualViewportSize = await driver.getViewportSize()
    if (utils.geometry.equals(actualViewportSize, requiredViewportSize)) return true
    logger.verbose(
      `Attempt to set viewport size to ${requiredViewportSize} failed. actualViewportSize=${actualViewportSize}`,
    )
    actualWindowSize = requiredWindowSize
    retries -= 1
  }

  logger.verbose(
    `Failed attempt to set viewport size. actualViewportSize=${actualViewportSize}, requiredViewportSize=${requiredViewportSize}. Trying again...`,
  )

  throw new Error('Failed to set viewport size!')
}
/**
 * Get current context content size
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @return {Region} current context content size
 */
async function getDocumentSize(_logger, context) {
  try {
    const {width = 0, height = 0} = await context.execute(snippets.getDocumentSize)
    return {width, height}
  } catch (err) {
    throw new Error('Failed to extract entire size!', err)
  }
}

async function getElementContentSize({context, element}) {
  return context.execute(snippets.getElementContentSize, [element])
}
async function getElementRegion({context, element, withBorders = true}) {
  return context.execute(snippets.getElementRect, [element, withBorders])
}
async function getPixelRatio(_logger, context) {
  const pixelRatio = await context.execute(snippets.getPixelRatio)
  return Number.parseFloat(pixelRatio)
}
async function getUserAgent(_logger, context) {
  return context.execute(snippets.getUserAgent)
}
async function getInnerOffset(_logger, context, element) {
  const {x = 0, y = 0} = await context.execute(snippets.getElementInnerOffset, [element])
  return {x, y}
}
async function getScrollOffset(_logger, context, element) {
  const {x = 0, y = 0} = await context.execute(snippets.getElementScrollOffset, [element])
  return {x, y}
}
async function scrollTo(_logger, context, offset, element) {
  return context.execute(snippets.scrollTo, [element, {x: Math.round(offset.x), y: Math.round(offset.y)}])
}
async function getTranslateOffset(_logger, context, element) {
  return context.execute(snippets.getElementTranslateOffset, [element])
}
/**
 * Set translate position of the specified element or default scrolling element
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {Location} location - required translate position
 * @param {EyesElement} [element] - element to set translate position
 * @return {Promise<Location>} actual translate position after set
 */
async function translateTo(_logger, context, offset, element) {
  return context.execute(snippets.translateTo, [element, {x: Math.round(offset.x), y: Math.round(offset.y)}])
}
/**
 * Check if the specified element or default scrolling element is scrollable
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {EyesElement} [element] - element to check
 * @return {Promise<boolean>} true if element is scrollable, false otherwise
 */
async function isScrollable(_logger, context, element) {
  return context.execute(snippets.isElementScrollable, [element])
}
/**
 * Mark the specified element or default scrolling element with `data-applitools-scroll`
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {EyesElement} [element] - element to mark
 */
async function markScrollRootElement(_logger, context, element) {
  return context.execute(snippets.setElementAttributes, [element, {'data-applitools-scroll': true}])
}
/**
 * Get transforms of the specified element or default scrolling element
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {EyesElement} [element] - element to extract transforms
 * @return {Promise<Object>} element transforms
 */
async function getTransforms(_logger, context, element) {
  return context.execute(snippets.getElementStyleProperties, [element, ['transform', '-webkit-transform']])
}
/**
 * Set transforms for the specified element or default scrolling element
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {Object} transforms - collection of transforms to set
 * @param {EyesElement} [element] - element to set transforms
 */
async function setTransforms(_logger, context, transforms, element) {
  return context.execute(snippets.setElementStyleProperties, [element, transforms])
}
/**
 * Get overflow style property of the specified element
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {EyesElement} element - element to get overflow
 * @return {Promise<string?>} overflow value
 */
async function getOverflow(_logger, context, element) {
  const {overflow} = await context.execute(snippets.getElementStyleProperties, [element, ['overflow']])
  return overflow
}
/**
 * Set overflow style property of the specified element
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {EyesElement} element - element to set overflow
 * @return {Promise<string?>} original overflow value before set
 */
async function setOverflow(_logger, context, overflow, element) {
  try {
    const original = await context.execute(snippets.setElementStyleProperties, [element, {overflow}])
    await utils.general.sleep(200)
    return original.overflow
  } catch (err) {
    throw new Error('Failed to set overflow', err)
  }
}
/**
 * Blur the specified element or current active element
 * @template TElement
 * @param {Logger} logger
 * @param {EyesContext} context
 * @param {EyesElement} [element] - element to blur
 * @return {Promise<TElement>} actually blurred element if there is any
 */
async function blurElement(logger, context, element) {
  return context.execute(snippets.blurElement, [element]).catch(err => {
    logger.verbose('WARNING: Cannot hide caret!', err)
    return null
  })
}
/**
 * Focus the specified element
 * @param {Logger} logger
 * @param {EyesContext} context
 * @param {EyesElement} element - element to focus
 */
async function focusElement(logger, context, element) {
  return context.execute(snippets.focusElement, [element]).catch(err => {
    logger.verbose('WARNING: Cannot restore caret!', err)
    return null
  })
}
/**
 * Get element xpath selector related to the current context
 * @param {Logger} logger
 * @param {EyesContext} context
 * @param {EyesElement} element - element to calculate xpath
 * @return {Promise<string>} xpath selector
 */
async function getElementXpath(logger, context, element) {
  return context.execute(snippets.getElementXpath, [element]).catch(err => {
    logger.verbose('Warning: Failed to get element selector (xpath)', err)
    return null
  })
}

async function setElementMarkers(_logger, context, elementsById) {
  const elements = Object.values(elementsById)
  const ids = Object.keys(elementsById)
  await context.execute(snippets.setElementMarkers, [elements, ids])
}

async function cleanupElementMarkers(_logger, context, elements) {
  await context.execute(snippets.cleanupElementMarkers, [elements])
}

/**
 * @template TElement
 * @typedef ContextInfo
 * @prop {boolean} isRoot - is root context
 * @prop {boolean} isCORS - is cors context related to the parent
 * @prop {TElement} document - context document element
 * @prop {string} frameSelector - xpath to the frame element related to the parent context
 *
 * Extract information about relations between current context and its parent
 * @template TElement
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @return {Promise<ContextInfo<TElement>>} frame info
 */
async function getContextInfo(_logger, context) {
  const [documentElement, selector, isRoot, isCORS] = await context.execute(snippets.getContextInfo)
  return {documentElement, selector, isRoot, isCORS}
}
/**
 * Find by context information
 * @param {Logger} _logger
 * @param {EyesContext} context
 * @param {ContextInfo} contextInfo - target context info
 * @return {Promise<Frame>} frame
 */
async function getChildFramesInfo(_logger, context) {
  const info = await context.execute(snippets.getChildFramesInfo)
  return info
}

async function addPageMarker(_logger, context) {
  return context.execute(snippets.addPageMarker)
}

async function cleanupPageMarker(_logger, context) {
  await context.execute(snippets.cleanupPageMarker)
}

module.exports = {
  getViewportSize,
  setViewportSize,
  getDocumentSize,
  getElementContentSize,
  getElementRegion,
  getPixelRatio,
  getUserAgent,
  getScrollOffset,
  scrollTo,
  getTranslateOffset,
  translateTo,
  getInnerOffset,
  isScrollable,
  markScrollRootElement,
  getTransforms,
  setTransforms,
  getOverflow,
  setOverflow,
  blurElement,
  focusElement,
  getElementXpath,
  setElementMarkers,
  cleanupElementMarkers,
  getContextInfo,
  getChildFramesInfo,
  addPageMarker,
  cleanupPageMarker,
}
