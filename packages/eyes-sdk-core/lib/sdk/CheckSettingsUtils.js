const TypeUtils = require('../utils/TypeUtils')
const utils = require('@applitools/utils')
const snippets = require('@applitools/snippets')
const ImageMatchSettings = require('../config/ImageMatchSettings')

async function toPersistedCheckSettings({checkSettings, context, logger}) {
  const elementsById = {}
  const elementsByType = []
  let shadowElement = undefined
  let isFrameOrShadow = checkSettings.frame || checkSettings.shadow ? true : false

  const persistedCheckSettings = {
    ...checkSettings,
    frame: await referencesToPersistedRegions(checkSettings.frame, 'frame'),
    shadow: await referencesToPersistedRegions(checkSettings.shadow, 'shadow'),
    region: (await referencesToPersistedRegions(checkSettings.region && [checkSettings.region]))[0],
    ignoreRegions: await referencesToPersistedRegions(checkSettings.ignoreRegions),
    floatingRegions: await referencesToPersistedRegions(checkSettings.floatingRegions),
    strictRegions: await referencesToPersistedRegions(checkSettings.strictRegions),
    layoutRegions: await referencesToPersistedRegions(checkSettings.layoutRegions),
    contentRegions: await referencesToPersistedRegions(checkSettings.contentRegions),
    accessibilityRegions: await referencesToPersistedRegions(checkSettings.accessibilityRegions),
  }

  if (!isFrameOrShadow) await makePersistance()

  return {persistedCheckSettings, cleanupPersistance}

  async function referencesToPersistedRegions(references = [], elementType = undefined) {
    const persistedRegions = []
    for (const reference of references) {
      let currElements = {}
      const {region, ...options} = reference.region ? reference : {region: reference}
      let referenceRegions
      if (utils.types.has(region, ['width', 'height'])) {
        referenceRegions = [region]
      } else {
        let elements
        if (!shadowElement) elements = await context.elements(region)
        else if (elementType != 'shadow')
          elements = await context.getRegionWithInShadowElement(shadowElement, reference)
        if (elements) elementsByType.push(elementType)
        referenceRegions = elements.map(element => {
          const elementId = utils.general.guid()
          elementsById[elementId] = element
          // this is used when testing a region within shadow or frame as we need to call markPersistance in this method and not at the end
          currElements[elementId] = element
          return {
            type: 'css',
            selector: `[data-applitools-marker~="${elementId}"]`,
          }
        })
      }

      persistedRegions.push(...referenceRegions.map(region => (reference.region ? {region, ...options} : region)))
      if (elementType === 'shadow')
        shadowElement = await context.execute(snippets.getShadowContext, Object.values(currElements)[0])
      if (isFrameOrShadow) await makePersistance([Object.values(currElements), Object.keys(currElements)])
      if (elementType === 'frame') await context.switchToFrame(reference)
    }
    return persistedRegions
  }

  async function makePersistance(elements = undefined) {
    const params = elements ? elements : [Object.values(elementsById), Object.keys(elementsById)]
    await context.execute(snippets.setElementMarkers, params)
    logger.verbose(`elements marked: ${params[1]}`)
  }

  async function cleanupPersistance() {
    if (!isFrameOrShadow) {
      await context.execute(snippets.cleanupElementMarkers, [Object.values(elementsById)])
      logger.verbose(`elements cleaned up: ${Object.keys(elementsById)}`)
    } else {
      if (checkSettings.frame) await context.switchToDefaultContext()
      let elements = Object.values(elementsById)
      let ids = Object.keys(elementsById)
      for (let i = 0; i < elements.length; i++) {
        await context.execute(snippets.cleanupElementMarkers, [[elements[i]]])
        if (elementsByType[i] === 'frame') await context.switchToFrame(elements[i].selector)
        logger.verbose(`elements cleaned up: ${ids[i]}`)
      }
    }
  }
}

function toCheckWindowConfiguration({checkSettings, configuration}) {
  const config = {
    ignore:
      checkSettings.ignoreRegions &&
      checkSettings.ignoreRegions.map(region => {
        return utils.types.has(region, ['x', 'y'])
          ? {left: region.x, top: region.y, width: region.width, height: region.height}
          : region
      }),
    floating:
      checkSettings.floatingRegions &&
      checkSettings.floatingRegions.map(({region, ...offsets}) => {
        return utils.types.has(region, ['x', 'y'])
          ? {left: region.x, top: region.y, width: region.width, height: region.height, ...offsets}
          : {...region, ...offsets}
      }),
    strict:
      checkSettings.strictRegions &&
      checkSettings.strictRegions.map(region => {
        return utils.types.has(region, ['x', 'y'])
          ? {left: region.x, top: region.y, width: region.width, height: region.height}
          : region
      }),
    layout:
      checkSettings.layoutRegions &&
      checkSettings.layoutRegions.map(region => {
        return utils.types.has(region, ['x', 'y'])
          ? {left: region.x, top: region.y, width: region.width, height: region.height}
          : region
      }),
    content:
      checkSettings.contentRegions &&
      checkSettings.contentRegions.map(region => {
        return utils.types.has(region, ['x', 'y'])
          ? {left: region.x, top: region.y, width: region.width, height: region.height}
          : region
      }),
    accessibility:
      checkSettings.accessibilityRegions &&
      checkSettings.accessibilityRegions.map(({region, type}) => {
        if (utils.types.has(region, ['x', 'y'])) {
          region = {left: region.x, top: region.y, width: region.width, height: region.height}
        }
        return {...region, accessibilityType: type}
      }),
    target: checkSettings.region ? 'region' : 'window',
    fully: configuration.getForceFullPageScreenshot() || checkSettings.fully || false,
    tag: checkSettings.name,
    scriptHooks: checkSettings.hooks,
    sendDom: configuration.getSendDom() || checkSettings.sendDom, // this is wrong, but kept for backwards compatibility,
    ignoreDisplacements: checkSettings.ignoreDisplacements,
    matchLevel: TypeUtils.getOrDefault(checkSettings.matchLevel, configuration.getMatchLevel()),
    visualGridOptions: TypeUtils.getOrDefault(checkSettings.visualGridOptions, configuration.getVisualGridOptions()),
    enablePatterns: TypeUtils.getOrDefault(checkSettings.enablePatterns, configuration.getEnablePatterns()),
    useDom: TypeUtils.getOrDefault(checkSettings.useDom, configuration.getUseDom()),
    variationGroupId: checkSettings.variationGroupId,
  }

  if (config.target === 'region') {
    if (utils.types.has(checkSettings.region, ['width', 'height'])) {
      config.region = utils.types.has(checkSettings.region, ['x', 'y'])
        ? {
            left: checkSettings.region.x,
            top: checkSettings.region.y,
            width: checkSettings.region.width,
            height: checkSettings.region.height,
          }
        : checkSettings.region
    } else {
      config.selector = checkSettings.frame.concat(checkSettings.shadow).concat(checkSettings.region)
    }
  }

  return config
}

function toMatchSettings({checkSettings = {}, configuration}) {
  const matchSettings = {
    matchLevel: checkSettings.matchLevel || configuration.getDefaultMatchSettings().getMatchLevel(),
    ignoreCaret: checkSettings.ignoreCaret || configuration.getDefaultMatchSettings().getIgnoreCaret(),
    useDom: checkSettings.useDom || configuration.getDefaultMatchSettings().getUseDom(),
    enablePatterns: checkSettings.enablePatterns || configuration.getDefaultMatchSettings().getEnablePatterns(),
    ignoreDisplacements:
      checkSettings.ignoreDisplacements || configuration.getDefaultMatchSettings().getIgnoreDisplacements(),
    accessibilitySettings: configuration.getDefaultMatchSettings().getAccessibilitySettings(),
    exact: null,
    ignore: transformRegions(checkSettings.ignoreRegions),
    layout: transformRegions(checkSettings.layoutRegions),
    strict: transformRegions(checkSettings.strictRegions),
    content: transformRegions(checkSettings.contentRegions),
    floating: transformRegions(checkSettings.floatingRegions),
    accessibility: transformRegions(checkSettings.accessibilityRegions),
  }

  return new ImageMatchSettings(matchSettings)

  function transformRegions(regions) {
    if (!regions || regions.length === 0) return regions
    return regions.map(target => {
      const {region, ...options} = target.region ? target : {region: target}
      if (utils.types.has(region, ['x', 'y', 'width', 'height'])) {
        return {
          left: Math.round(region.x),
          top: Math.round(region.y),
          width: Math.round(region.width),
          height: Math.round(region.height),
          ...options,
        }
      }
      return region
    })
  }
}

async function toScreenshotCheckSettings({checkSettings, context, screenshot}) {
  const screenshotCheckSettings = {
    ...checkSettings,
    ignoreRegions: await referencesToRegions(checkSettings.ignoreRegions),
    floatingRegions: await referencesToRegions(checkSettings.floatingRegions),
    strictRegions: await referencesToRegions(checkSettings.strictRegions),
    layoutRegions: await referencesToRegions(checkSettings.layoutRegions),
    contentRegions: await referencesToRegions(checkSettings.contentRegions),
    accessibilityRegions: await referencesToRegions(checkSettings.accessibilityRegions),
  }

  return screenshotCheckSettings

  async function referencesToRegions(references) {
    if (!references) return references
    const regions = []
    for (const reference of references) {
      const referenceRegions = []
      const {region, ...options} = reference.region ? reference : {region: reference}
      if (utils.types.has(region, ['x', 'y', 'width', 'height'])) {
        referenceRegions.push(region)
      } else {
        const elements = await context.elements(region)
        const contextLocationInViewport = await context.getLocationInViewport()

        for (const element of elements) {
          const region = utils.geometry.offset(await element.getRegion(), contextLocationInViewport)
          referenceRegions.push({
            x: Math.max(0, region.x - screenshot.region.x),
            y: Math.max(0, region.y - screenshot.region.y),
            width: region.width,
            height: region.height,
          })
        }
      }
      regions.push(...referenceRegions.map(region => (reference.region ? {region, ...options} : region)))
    }
    return regions
  }
}

module.exports = {
  toPersistedCheckSettings,
  toCheckWindowConfiguration,
  toScreenshotCheckSettings,
  toMatchSettings,
}
