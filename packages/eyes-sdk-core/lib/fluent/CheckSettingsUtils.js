const TypeUtils = require('../utils/TypeUtils')
const utils = require('@applitools/utils')
const snippets = require('@applitools/snippets')
const ImageMatchSettings = require('../config/ImageMatchSettings')

async function toPersistedCheckSettings({checkSettings, context, logger}) {
  const elementsById = {}

  const persistedCheckSettings = {
    ...checkSettings,
    region: (await referencesToPersistedRegions(checkSettings.region && [checkSettings.region]))[0],
    ignoreRegions: await referencesToPersistedRegions(checkSettings.ignoreRegions),
    floatingRegions: await referencesToPersistedRegions(checkSettings.floatingRegions),
    strictRegions: await referencesToPersistedRegions(checkSettings.strictRegions),
    layoutRegions: await referencesToPersistedRegions(checkSettings.layoutRegions),
    contentRegions: await referencesToPersistedRegions(checkSettings.contentRegions),
    accessibilityRegions: await referencesToPersistedRegions(checkSettings.accessibilityRegions),
  }

  await makePersistance()

  return {persistedCheckSettings, cleanupPersistance}

  async function referencesToPersistedRegions(references = []) {
    const persistedRegions = []
    for (const reference of references) {
      const {region, ...options} = reference.region ? reference : {region: reference}
      let referenceRegions
      if (utils.types.has(region, ['width', 'height'])) {
        referenceRegions = [region]
      } else {
        const elements = await context.elements(region)
        referenceRegions = elements.map(element => {
          const elementId = utils.general.guid()
          elementsById[elementId] = element
          return {
            type: 'css',
            selector: `[data-applitools-marker~="${elementId}"]`,
          }
        })
      }

      persistedRegions.push(...referenceRegions.map(region => (reference.region ? {region, ...options} : region)))
    }
    return persistedRegions
  }

  async function makePersistance() {
    await context.execute(snippets.setElementMarkers, [Object.values(elementsById), Object.keys(elementsById)])
    logger.verbose(`elements marked: ${Object.keys(elementsById)}`)
  }

  async function cleanupPersistance() {
    await context.execute(snippets.cleanupElementMarkers, [Object.values(elementsById)])
    logger.verbose(`elements cleaned up: ${Object.keys(elementsById)}`)
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
    ignoreDisplacements: checkSettings.ignoreDisplacement,
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
      config.selector = checkSettings.region
    }
  }

  return config
}

async function toMatchSettings({context, checkSettings = {}, configuration, targetRegion}) {
  const matchSettings = {
    matchLevel: checkSettings.matchLevel || configuration.getDefaultMatchSettings().getMatchLevel(),
    ignoreCaret: checkSettings.ignoreCaret || configuration.getDefaultMatchSettings().getIgnoreCaret(),
    useDom: checkSettings.useDom || configuration.getDefaultMatchSettings().getUseDom(),
    enablePatterns: checkSettings.enablePatterns || configuration.getDefaultMatchSettings().getEnablePatterns(),
    ignoreDisplacements:
      checkSettings.ignoreDisplacements || configuration.getDefaultMatchSettings().getIgnoreDisplacements(),
    accessibilitySettings: configuration.getDefaultMatchSettings().getAccessibilitySettings(),
    exact: null,
    ignore: await referencesToRegions(checkSettings.ignoreRegions),
    layout: await referencesToRegions(checkSettings.layoutRegions),
    strict: await referencesToRegions(checkSettings.strictRegions),
    content: await referencesToRegions(checkSettings.contentRegions),
    floating: await referencesToRegions(checkSettings.floatingRegions),
    accessibility: await referencesToRegions(checkSettings.accessibilityRegions),
  }

  return new ImageMatchSettings(matchSettings)

  async function referencesToRegions(references) {
    if (!references) return references
    const regions = []
    for (const reference of references) {
      const {region, ...options} = reference.region ? reference : {region: reference}
      if (utils.types.has(region, ['width', 'height'])) {
        regions.push({
          left: Math.round(region.x),
          top: Math.round(region.y),
          width: Math.round(region.width),
          height: Math.round(region.height),
          ...options,
        })
      } else {
        const elements = await context.elements(region)
        for (const element of elements) {
          const region = utils.geometry.subtraction(await element.getRegion(), targetRegion)
          regions.push({
            left: Math.round(region.x),
            top: Math.round(region.y),
            width: Math.round(region.width),
            height: Math.round(region.height),
            ...options,
          })
        }
      }
    }
    return regions
  }
}

module.exports = {
  toPersistedCheckSettings,
  toCheckWindowConfiguration,
  toMatchSettings,
}
