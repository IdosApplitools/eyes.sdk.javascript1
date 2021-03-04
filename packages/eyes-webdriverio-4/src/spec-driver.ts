import * as utils from '@applitools/utils'
import {LegacySelector, withLegacyDriverAPI} from './legacy-api'
import type {Client as WDIOBrowser, Element as WDIOElement, RawResult} from 'webdriverio'

export type Driver = WDIOBrowser<void>
export type Element =
  | WDIOElement
  | {ELEMENT: string}
  | {'element-6066-11e4-a52e-4f735466cecf': string}
  | RawResult<WDIOElement>
export type Selector = LegacySelector | string

// #region HELPERS

const LEGACY_ELEMENT_ID = 'ELEMENT'
const ELEMENT_ID = 'element-6066-11e4-a52e-4f735466cecf'

function extractElementId(element: Element): string {
  if (utils.types.has(element, 'elementId')) return element.elementId
  else if (utils.types.has(element, ELEMENT_ID)) return element[ELEMENT_ID]
  else if (utils.types.has(element, LEGACY_ELEMENT_ID)) return element[LEGACY_ELEMENT_ID]
}

function transformSelector(selector: Selector) {
  if (selector instanceof LegacySelector) {
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
    utils.types.isString(selector) ||
    utils.types.has(selector, ['type', 'selector']) ||
    selector instanceof LegacySelector
  )
}
export function transformElement(element: Element): Element {
  const elementId = extractElementId(utils.types.has(element, 'value') ? element.value : element)
  return {[ELEMENT_ID]: elementId, [LEGACY_ELEMENT_ID]: elementId}
}
export function extractSelector(element: Element): Selector {
  return utils.types.has(element, 'selector') ? element.selector as string : null
}
export function isStaleElementError(error: any, selector: Selector): boolean {
  if (!error) return false
  const errOrResult = error.originalError || error
  return errOrResult instanceof Error
    ? (errOrResult as any).seleniumStack && (errOrResult as any).seleniumStack.type === 'StaleElementReference'
    : errOrResult.value && errOrResult.selector && errOrResult.selector === selector
}
export function isEqualElements(_browser: Driver, element1: Element, element2: Element): boolean {
  if (!element1 || !element2) return false
  const elementId1 = extractElementId(element1)
  const elementId2 = extractElementId(element2)
  return elementId1 === elementId2
}

// #endregion

// #region COMMANDS

export async function executeScript(browser: Driver, script: ((...args: any) => any) | string, ...args: any[]): Promise<any> {
  const {value} = await browser.execute(script, ...args)
  return value
}
export async function mainContext(browser: Driver): Promise<void> {
  await browser.frame(null)
}
export async function parentContext(browser: Driver): Promise<void> {
  await browser.frameParent()
}
export async function childContext(browser: Driver, element: Element): Promise<any> {
  await browser.frame(element)
}
export async function findElement(browser: Driver, selector: Selector): Promise<Element> {
  const {value} = await browser.element(transformSelector(selector))
  return value
}
export async function findElements(browser: Driver, selector: Selector): Promise<Element[]> {
  const {value} = await browser.elements(transformSelector(selector))
  return value
}
export async function getElementRect(browser: Driver, element: Element): Promise<{x: number; y: number; width: number; height: number}> {
  const {value} = await browser.elementIdRect(extractElementId(element))
  return value
}
export async function getWindowRect(browser: Driver): Promise<{x: number; y: number; width: number; height: number}> {
  const {value: location} = await browser.windowHandlePosition() as {value: {x: number, y: number}}
  const {value: size} = await browser.windowHandleSize() as {value: {width: number, height: number}}
  return {x: location.x, y: location.y, width: size.width, height: size.height}
}
export async function setWindowRect(browser: Driver, rect: {x?: number; y?: number; width?: number; height?: number}): Promise<void> {
  const {x = null, y = null, width = null, height = null} = rect || {}
  if (x !== null && y !== null) {
    await browser.windowHandlePosition({x, y})
  }
  if (width !== null && height !== null) {
    await browser.windowHandleSize({width, height})
  }
}
export async function getOrientation(browser: Driver): Promise<string> {
  const orientation = await browser.getOrientation() as unknown as string
  return orientation.toLowerCase()
}
export async function getDriverInfo(browser: Driver): Promise<any> {
  return {
    sessionId: (browser as any).requestHandler.sessionID || browser.sessionId,
    isMobile: browser.isMobile,
    isNative: browser.isMobile && !browser.desiredCapabilities.browserName,
    deviceName: browser.desiredCapabilities.deviceName,
    platformName:
      (browser.isIOS && 'iOS') ||
      (browser.isAndroid && 'Android') ||
      browser.desiredCapabilities.platformName ||
      browser.desiredCapabilities.platform,
    platformVersion: browser.desiredCapabilities.platformVersion,
    browserName: browser.desiredCapabilities.browserName,
    browserVersion: browser.desiredCapabilities.browserVersion,
  }
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
export async function type(browser: Driver, element: Element, keys: string): Promise<void> {
  if (isSelector(element)) browser.setValue(transformSelector(element), keys)
  else browser.elementIdValue(extractElementId(element), keys)
}
export async function waitUntilDisplayed(browser: Driver, selector: Selector, timeout: number): Promise<void>  {
  await browser.waitForVisible(selector as string, timeout)
}
export async function scrollIntoView(browser: Driver, element: Element | Selector, align = false): Promise<void>  {
  if (isSelector(element)) element = await findElement(browser, element)
  await browser.execute('arguments[0].scrollIntoView(arguments[1])', element, align)
}
export async function hover(browser: Driver, element: Element, {x = 0, y = 0} = {}): Promise<void>  {
  if (isSelector(element)) element = await findElement(browser, element)
  await browser.moveTo(extractElementId(element), x, y)
}

// #endregion

// #region TESTING

const browserOptionsNames: Record<string, string> = {
  chrome: 'goog:chromeOptions',
  firefox: 'moz:firefoxOptions',
}
export async function build(env: any): Promise<[Driver, () => Promise<void>]> {
  const webdriverio = require('webdriverio')
  const chromedriver = require('chromedriver')
  const {testSetup} = require('@applitools/sdk-shared')
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
  } = testSetup.Env({...env, legacy: true})

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
    const browserOptionsName =
      browserOptionsNames[browser || options.desiredCapabilities.browserName]
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

export const wrapDriver = withLegacyDriverAPI

// #endregion
