import * as utils from '@applitools/utils'
import type * as types from '@applitools/types'
import type * as Puppeteer from 'puppeteer'

export type Driver = Puppeteer.Page
export type Context = Puppeteer.Frame
export type Element = Puppeteer.ElementHandle
export type Selector = string

type CommonSelector = string | {selector: Selector | string; type?: string}

// #region HELPERS

async function handleToObject(handle: Puppeteer.JSHandle): Promise<any> {
  const [, type] = handle.toString().split('@')
  if (type === 'array') {
    const map = await handle.getProperties()
    return Promise.all(Array.from(map.values(), handleToObject))
  } else if (type === 'object') {
    const map = await handle.getProperties()
    const chunks = await Promise.all(Array.from(map, async ([key, handle]) => ({[key]: await handleToObject(handle)})))
    return chunks.length > 0 ? Object.assign(...(chunks as [any])) : {}
  } else if (type === 'node') {
    return handle.asElement()
  } else {
    return handle.jsonValue()
  }
}
function transformArgument(arg: any) {
  const elements: Element[] = []
  const argWithElementMarkers = transform(arg)

  return [argWithElementMarkers, ...elements]

  function transform(arg: any): any {
    if (isElement(arg)) {
      elements.push(arg)
      return {isElement: true}
    } else if (utils.types.isArray(arg)) {
      return arg.map(transform)
    } else if (utils.types.isObject(arg)) {
      return Object.entries(arg).reduce((object, [key, value]) => {
        return Object.assign(object, {[key]: transform(value)})
      }, {})
    } else {
      return arg
    }
  }
}
// NOTE:
// A few things to note:
//  - this function runs inside of the browser process
//  - evaluations in Puppeteer accept multiple arguments (not just one like in Playwright)
//  - an element reference (a.k.a. an ElementHandle) can only be sent as its
//    own argument. To account for this, we use a wrapper function to receive all
//    of the arguments in a serialized structure, deserialize them, and call the script,
//    and pass the arguments as originally intended
function scriptRunner(script: string, arg: any, ...elements: HTMLElement[]) {
  const func = new Function(script.startsWith('function') ? `return (${script}).apply(null, arguments)` : script)
  return func(transform(arg))

  function transform(arg: any): any {
    if (!arg) {
      return arg
    } else if (arg.isElement) {
      return elements.shift()
    } else if (Array.isArray(arg)) {
      return arg.map(transform)
    } else if (typeof arg === 'object') {
      return Object.entries(arg).reduce((object, [key, value]) => {
        return Object.assign(object, {[key]: transform(value)})
      }, {})
    } else {
      return arg
    }
  }
}
function isXpath(selector: Selector): boolean {
  return selector.startsWith('//') || selector.startsWith('..')
}

// #endregion

// #region UTILITY

export function isDriver(page: any): page is Driver {
  if (!page) return false
  return utils.types.instanceOf(page, 'Page')
}
export function isContext(frame: any): frame is Context {
  if (!frame) return false
  return utils.types.instanceOf(frame, 'Frame')
}
export function isElement(element: any): element is Element {
  if (!element) return false
  return utils.types.instanceOf(element, 'ElementHandle')
}
export function isSelector(selector: any): selector is Selector {
  return utils.types.isString(selector)
}
export function transformSelector(selector: Selector | CommonSelector): Selector {
  if (utils.types.has(selector, 'selector')) return selector.selector
  return selector
}
export function extractContext(page: Driver | Context): Context {
  return isDriver(page) ? page.mainFrame() : page
}
export function isStaleElementError(err: any): boolean {
  return (
    err &&
    err.message &&
    (err.message.includes('Execution context was destroyed') ||
      err.message.includes('JSHandles can be evaluated only in the context they were created'))
  )
}

// #endregion

// #region COMMANDS

export async function executeScript(frame: Context, script: ((arg: any) => any) | string, arg: any): Promise<any> {
  script = utils.types.isString(script) ? script : `function() {return (${script.toString()}).apply(null, arguments)}`
  const result = await frame.evaluateHandle(scriptRunner, script, ...transformArgument(arg))
  return handleToObject(result)
}
export async function mainContext(frame: Context): Promise<Context> {
  frame = extractContext(frame)
  let mainFrame = frame
  while (mainFrame.parentFrame()) {
    mainFrame = mainFrame.parentFrame()
  }
  return mainFrame
}
export async function parentContext(frame: Context): Promise<Context> {
  frame = extractContext(frame)
  return frame.parentFrame()
}
export async function childContext(_frame: Context, element: Element): Promise<Context> {
  return element.contentFrame()
}
export async function findElement(frame: Context, selector: Selector, parent?: Element): Promise<Element> {
  const root = parent ?? frame
  return isXpath(selector) ? root.$x(selector).then(elements => elements[0]) : root.$(selector)
}
export async function findElements(frame: Context, selector: Selector, parent?: Element): Promise<Element[]> {
  const root = parent ?? frame
  return isXpath(selector) ? root.$x(selector) : root.$$(selector)
}
export async function getViewportSize(page: Driver): Promise<{width: number; height: number}> {
  return page.viewport()
}
export async function setViewportSize(page: Driver, size: {width: number; height: number}): Promise<void> {
  await page.setViewport(size)
  await new Promise(res => setTimeout(res, 100))
}
export async function getTitle(page: Driver): Promise<string> {
  return page.title()
}
export async function getUrl(page: Driver): Promise<string> {
  return page.url()
}
export async function visit(page: Driver, url: string): Promise<void> {
  await page.goto(url)
}
export async function takeScreenshot(page: Driver): Promise<string> {
  const scr = await (page as any)._client.send('Page.captureScreenshot')
  return scr.data
}
export async function click(frame: Context, element: Element | Selector): Promise<void> {
  if (isSelector(element)) element = await findElement(frame, element)
  await element.click()
}
export async function type(frame: Context, element: Element | Selector, keys: string): Promise<void> {
  if (isSelector(element)) element = await findElement(frame, element)
  return element.type(keys)
}
export async function hover(frame: Context, element: Element | Selector): Promise<void> {
  if (isSelector(element)) element = await findElement(frame, element)
  await element.hover()
}
export async function scrollIntoView(frame: Context, element: Element | Selector, align = false): Promise<void> {
  if (isSelector(element)) element = await findElement(frame, element)
  await frame.evaluate((element, align) => element.scrollIntoView(align), element, align)
}
export async function waitUntilDisplayed(frame: Context, selector: Selector): Promise<void> {
  await frame.waitForSelector(selector)
}

export async function getCookies(page: Driver): Promise<types.CookiesObject> {
  const cdpSession = await page.target().createCDPSession()
  const {cookies} = await cdpSession.send('Network.getAllCookies')

  return {
    cookies,
    all: true,
  }
}

// #endregion

// #region BUILD

export async function build(env: any): Promise<[Driver, () => Promise<void>]> {
  const puppeteer = require('puppeteer')
  env = {
    ...env,
    ignoreDefaultArgs: ['--hide-scrollbars'],
    executablePath: 'google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  }
  // forcing headlesss since all funcitonality works headlessly
  // to re-enable, need to work out some performance issues with xvfb & coverage-tests
  delete env.headless
  if (process.env.APPLITOOLS_DEBUG) {
    env.headless = false
    env.devtools = true
    delete env.executablePath
  }
  if (process.platform !== 'linux') delete env.executablePath
  const driver = await puppeteer.launch(env)
  const page = await driver.newPage()
  return [page, () => driver.close()]
}

// #endregion
