import * as utils from '@applitools/utils'
import * as legacy from './legacy'

export type Driver = WebdriverIO.Client<void>
export type Element =
  | WebdriverIO.Element
  | {ELEMENT: string}
  | {'element-6066-11e4-a52e-4f735466cecf': string}
  | WebdriverIO.RawResult<WebdriverIO.Element | {ELEMENT: string} | {'element-6066-11e4-a52e-4f735466cecf': string}>
export type Selector = string | legacy.By

// #region HELPERS

const LEGACY_ELEMENT_ID = 'ELEMENT'
const ELEMENT_ID = 'element-6066-11e4-a52e-4f735466cecf'

function extractElementId(element: Element): string {
  if (utils.types.has(element, 'elementId')) return element.elementId as string
  else if (utils.types.has(element, ELEMENT_ID)) return element[ELEMENT_ID]
  else if (utils.types.has(element, LEGACY_ELEMENT_ID)) return element[LEGACY_ELEMENT_ID]
}

function transformSelector(selector: Selector): string {
  if (selector instanceof legacy.By) {
    return selector.toString()
  } else if (utils.types.has(selector, ['type', 'selector'])) {
    if (selector.type === 'css') return `css selector:${selector.selector}`
    else if (selector.type === 'xpath') return `xpath:${selector.selector}`
    else return `${selector.type}:${selector.selector}`
  }
  return selector
}

// #endregion

// #region UTILITY

export function isDriver(browser: any): browser is Driver {
  if (!browser) return false
  return Boolean(browser.getPrototype && browser.desiredCapabilities && browser.requestHandler)
}
export function isElement(element: any): element is Element {
  if (!element) return false
  return element.value
    ? Boolean(element.value[ELEMENT_ID] || element.value[LEGACY_ELEMENT_ID])
    : Boolean(element[ELEMENT_ID] || element[LEGACY_ELEMENT_ID])
}
export function isSelector(selector: any): selector is Selector {
  return (
    utils.types.isString(selector) || utils.types.has(selector, ['type', 'selector']) || selector instanceof legacy.By
  )
}
export function transformDriver(browser: Driver): Driver {
  return new Proxy(browser, {
    get: (target, key) => {
      if (key === 'then') return undefined
      return Reflect.get(target, key)
    },
  })
}
export function transformElement(element: Element): Element {
  const elementId = extractElementId(utils.types.has(element, 'value') ? element.value : element)
  return {[ELEMENT_ID]: elementId, [LEGACY_ELEMENT_ID]: elementId}
}
export function extractSelector(element: Element): Selector {
  return utils.types.has(element, 'selector') ? (element.selector as string) : undefined
}
export function isStaleElementError(error: any, selector: Selector): boolean {
  if (!error) return false
  const errOrResult = error.originalError || error
  return errOrResult instanceof Error
    ? (errOrResult as any).seleniumStack && (errOrResult as any).seleniumStack.type === 'StaleElementReference'
    : errOrResult.value && errOrResult.selector && errOrResult.selector === selector
}
export async function isEqualElements(_browser: Driver, element1: Element, element2: Element): Promise<boolean> {
  if (!element1 || !element2) return false
  const elementId1 = extractElementId(element1)
  const elementId2 = extractElementId(element2)
  return elementId1 === elementId2
}

// #endregion

// #region COMMANDS

export async function executeScript(browser: Driver, script: ((arg: any) => any) | string, arg: any): Promise<any> {
  const {value} = await browser.execute(script, arg)
  return value
}
export async function mainContext(browser: Driver): Promise<Driver> {
  await browser.frame(null)
  return browser
}
export async function parentContext(browser: Driver): Promise<Driver> {
  await browser.frameParent()
  return browser
}
export async function childContext(browser: Driver, element: Element): Promise<Driver> {
  await browser.frame(element)
  return browser
}
export async function findElement(browser: Driver, selector: Selector): Promise<Element> {
  const {value} = await browser.element(transformSelector(selector))
  return value
}
export async function findElements(browser: Driver, selector: Selector): Promise<Element[]> {
  const {value} = await browser.elements(transformSelector(selector))
  return value
}
export async function getElementRect(
  browser: Driver,
  element: Element,
): Promise<{x: number; y: number; width: number; height: number}> {
  const {value} = await browser.elementIdRect(extractElementId(element))
  return value
}
export async function getWindowSize(browser: Driver): Promise<{width: number; height: number}> {
  const {value: size} = (await browser.windowHandleSize()) as {value: {width: number; height: number}}
  return {width: size.width, height: size.height}
}
export async function setWindowSize(browser: Driver, size: {width: number; height: number}): Promise<void> {
  await browser.windowHandlePosition({x: 0, y: 0})
  await browser.windowHandleSize(size)
}
export async function getDriverInfo(browser: Driver): Promise<any> {
  const capabilities = browser.desiredCapabilities as any

  const info: any = {
    sessionId: (browser as any).requestHandler.sessionID || browser.sessionId,
    isMobile: browser.isMobile,
    isNative: browser.isMobile && !capabilities.browserName,
    deviceName: capabilities.deviceName,
    platformName:
      (browser.isIOS && 'iOS') ||
      (browser.isAndroid && 'Android') ||
      capabilities.platformName ||
      capabilities.platform,
    platformVersion: capabilities.platformVersion,
    browserName: capabilities.browserName ?? capabilities.name,
    browserVersion: capabilities.browserVersion ?? capabilities.version,
    pixelRatio: capabilities.pixelRatio,
  }

  if (info.isNative) {
    const {pixelRatio, viewportRect}: any = utils.types.has(capabilities, ['viewportRect', 'pixelRatio'])
      ? capabilities
      : await browser.session()

    info.pixelRatio = pixelRatio
    if (viewportRect) {
      info.viewportRegion = {
        x: viewportRect.left,
        y: viewportRect.top,
        width: viewportRect.width,
        height: viewportRect.height,
      }
    }
  }

  return info
}
export async function getTitle(browser: Driver): Promise<string> {
  return browser.getTitle()
}
export async function getUrl(browser: Driver): Promise<string> {
  return browser.getUrl()
}
export async function visit(browser: Driver, url: string): Promise<void> {
  await browser.url(url)
}
export async function takeScreenshot(driver: Driver): Promise<Buffer> {
  return driver.saveScreenshot()
}
export async function click(browser: Driver, element: Element | Selector): Promise<void> {
  if (isSelector(element)) element = await findElement(browser, element)
  await browser.elementIdClick(extractElementId(element))
}
export async function hover(
  browser: Driver,
  element: Element | Selector,
  offset?: {x: number; y: number},
): Promise<void> {
  if (isSelector(element)) element = await findElement(browser, element)
  await browser.moveTo(extractElementId(element), offset?.x, offset?.y)
}
export async function type(browser: Driver, element: Element | Selector, keys: string): Promise<void> {
  if (isSelector(element)) browser.setValue(transformSelector(element), keys)
  else browser.elementIdValue(extractElementId(element), keys)
}
export async function scrollIntoView(browser: Driver, element: Element | Selector, align = false): Promise<void> {
  if (isSelector(element)) element = await findElement(browser, element)
  await browser.execute('arguments[0].scrollIntoView(arguments[1])', element, align)
}
export async function waitUntilDisplayed(browser: Driver, selector: Selector, timeout: number): Promise<void> {
  await browser.waitForVisible(selector as string, timeout)
}

// #endregion

// #region MOBILE COMMANDS

export async function getOrientation(browser: Driver): Promise<'portrait' | 'landscape'> {
  const orientation = ((await browser.getOrientation()) as unknown) as string
  return orientation.toLowerCase() as 'portrait' | 'landscape'
}
export async function getElementRegion(
  browser: Driver,
  element: Element,
): Promise<{x: number; y: number; width: number; height: number}> {
  const extendedElement = (await browser.$(element as any)) as any
  if (utils.types.isFunction(extendedElement, 'getRect')) {
    return extendedElement.getRect()
  } else {
    const region = {x: 0, y: 0, width: 0, height: 0}
    const location = await extendedElement.getLocation()
    region.x = location.x
    region.y = location.y
    const size = await extendedElement.getSize()
    region.width = size.width
    region.height = size.height
    return region
  }
}
export async function getElementAttribute(browser: Driver, element: Element, attr: string): Promise<string> {
  const result = await browser.elementIdAttribute(extractElementId(element), attr)
  return result.value
}
export async function getElementText(browser: Driver, element: Element): Promise<string> {
  const result = browser.elementIdText(extractElementId(element))
  return result.value
}
export async function performAction(browser: Driver, steps: any[]): Promise<void> {
  await browser.touchPerform(steps.map(({action, ...options}) => ({action, options})))
}

// #region TESTING

const browserOptionsNames: Record<string, string> = {
  chrome: 'goog:chromeOptions',
  firefox: 'moz:firefoxOptions',
}
export async function build(env: any): Promise<[Driver, () => Promise<void>]> {
  const webdriverio = require('webdriverio')
  const chromedriver = require('chromedriver')
  const parseEnv = require('@applitools/test-utils/src/parse-env')
  const {
    browser = '',
    capabilities,
    url,
    attach,
    proxy,
    configurable = true,
    args = [],
    headless,
    logLevel = 'silent',
  } = parseEnv({...env, legacy: true})

  const options = {
    desiredCapabilities: {browserName: browser, ...capabilities},
    logLevel,
    protocol: url.protocol ? url.protocol.replace(/:$/, '') : undefined,
    host: url.hostname,
    port: url.port,
    path: url.pathname,
  }
  if (configurable) {
    if (browser === 'chrome' && attach) {
      await chromedriver.start(['--port=9515'], true)
      options.protocol = 'http'
      options.host = 'localhost'
      options.port = '9515'
      options.path = '/'
    }
    const browserOptionsName = browserOptionsNames[browser || options.desiredCapabilities.browserName]
    if (browserOptionsName) {
      const browserOptions = options.desiredCapabilities[browserOptionsName] || {}
      browserOptions.args = [...(browserOptions.args || []), ...args]
      if (headless) browserOptions.args.push('headless')
      if (attach) {
        browserOptions.debuggerAddress = attach === true ? 'localhost:9222' : attach
      }
      options.desiredCapabilities[browserOptionsName] = browserOptions
    }
  }
  if (proxy) {
    options.desiredCapabilities.proxy = {
      proxyType: 'manual',
      httpProxy: proxy.http || proxy.server,
      sslProxy: proxy.https || proxy.server,
      ftpProxy: proxy.ftp,
      noProxy: proxy.bypass.join(','),
    }
  }
  const driver = webdriverio.remote(options)
  await driver.init()

  return [driver, () => driver.end().then(() => chromedriver.stop())]
}

// #endregion

// #region LEGACY API

export const wrapDriver = legacy.wrapDriver

// #endregion
