const assert = require('assert')
const spec = require('../../dist/spec-driver')

function isEqualElements(frame, element1, element2) {
  return frame.evaluate((element1, element2) => element1 === element2, element1, element2).catch(() => false)
}

describe('spec driver', async () => {
  let page, destroyPage
  const url = 'https://applitools.github.io/demo/TestPages/FramesTestPage/'

  describe('headless desktop', async () => {
    before(async () => {
      ;[page, destroyPage] = await spec.build({headless: true})
      await page.goto(url)
    })

    after(async () => {
      await destroyPage()
    })

    it('isDriver(driver)', isDriver({expected: true}))
    it('isDriver(wrong)', isDriver({input: {}, expected: false}))
    it('isElement(element)', isElement({input: () => page.$('div'), expected: true}))
    it('isElement(wrong)', isElement({input: () => ({}), expected: false}))
    it('isSelector(string)', isSelector({input: 'div', expected: true}))
    it('isSelector(wrong)', isSelector({input: {}, expected: false}))
    it('isStaleElementError(err)', isStaleElementError())
    it('executeScript(script, args)', executeScript())
    it('executeScript(script, nested args)', executeScriptNestedArgs())
    it('executeScript(script, arg (element))', executeScriptWithElement())
    it('mainContext()', mainContext())
    it('parentContext()', parentContext())
    it('childContext(element)', childContext())
    it('findElement(string)', findElement({input: '#overflowing-div'}))
    it('findElements(string)', findElements({input: 'div'}))
    it('findElement(non-existent)', findElement({input: 'non-existent', expected: null}))
    it('findElements(non-existent)', findElements({input: 'non-existent', expected: []}))
    it('getTitle()', getTitle())
    it('getUrl()', getUrl())
    it('visit()', visit())
    it('getViewportSize()', getViewportSize())
    it(
      'setViewportSize({width, height})',
      setViewportSize({
        input: {width: 501, height: 502},
        expected: {width: 501, height: 502},
      }),
    )
    it(
      'getCookies()',
      getCookies({
        all: true,
        cookies: [
          {
            domain: 'applitools.github.io',
            expires: -1,
            sameParty: false,
            httpOnly: false,
            session: true,
            size: 10,
            sourcePort: 443,
            sourceScheme: 'Secure',
            priority: 'Medium',
            path: '/',
            secure: true,
            name: 'hello',
            value: 'world',
          },
        ],
      }),
    )
  })

  function isDriver({input, expected}) {
    return async () => {
      const isDriver = await spec.isDriver(input || page)
      assert.strictEqual(isDriver, expected)
    }
  }
  function isElement({input, expected}) {
    return async () => {
      const element = await input()
      const isElement = await spec.isElement(element)
      assert.strictEqual(isElement, expected)
    }
  }
  function isSelector({input, expected}) {
    return async () => {
      const isSelector = await spec.isSelector(input)
      assert.strictEqual(isSelector, expected)
    }
  }
  function isStaleElementError() {
    return async () => {
      const element = await page.$('#overflowing-div')
      await page.reload()
      try {
        await element.click()
      } catch (err) {
        return assert.ok(spec.isStaleElementError(err))
      }
      assert.fail()
    }
  }
  function executeScript() {
    return async () => {
      const num = 0
      const str = 'string'
      const obj = {key: 'value', obj: {key: 0}}
      const arr = [0, 1, 2, {key: 3}]
      const el = await page.$('div')
      const fn = function () {
        return arguments
      }
      const result = await spec.executeScript(page, fn, {num, str, obj, arr, el})
      assert.strictEqual(result[0].num, num)
      assert.strictEqual(result[0].str, str)
      assert.deepStrictEqual(result[0].obj, obj)
      assert.deepStrictEqual(result[0].arr, arr)
      assert.ok(await isEqualElements(page, result[0].el, el))
    }
  }
  function executeScriptNestedArgs() {
    return async () => {
      const el = await page.$('div')
      const str = 'blah'
      const args = [[el], [str]]
      const fn = function () {
        return arguments
      }
      const result = await spec.executeScript(page, fn, args)
      assert.ok(await isEqualElements(page, result[0][0][0], el))
      assert.strictEqual(result[0][1][0], str)
    }
  }
  function executeScriptWithElement() {
    return async () => {
      const el = await page.$('div')
      const fn = function () {
        return arguments
      }
      let result = await spec.executeScript(page, fn, el)
      assert.ok(await isEqualElements(page, result[0], el))
    }
  }
  function mainContext() {
    return async () => {
      const mainDocument = await page.$('html')
      const frame1 = await page
        .mainFrame()
        .childFrames()
        .find(frame => frame.name() === 'frame1')
      const frame2 = await frame1.childFrames().find(frame => frame.name() === 'frame1-1')
      const frameDocument = await frame2.$('html')
      assert.ok(!(await isEqualElements(frame2, mainDocument, frameDocument)))
      const mainFrame = await spec.mainContext(frame2)
      const resultDocument = await mainFrame.$('html')
      assert.ok(await isEqualElements(mainFrame, resultDocument, mainDocument))
    }
  }
  function parentContext() {
    return async () => {
      const frame1 = await page
        .mainFrame()
        .childFrames()
        .find(frame => frame.name() === 'frame1')
      const parentDocument = await frame1.$('html')
      const frame2 = await frame1.childFrames().find(frame => frame.name() === 'frame1-1')
      const frameDocument = await frame2.$('html')
      assert.ok(!(await isEqualElements(frame2, parentDocument, frameDocument)))
      const parentFrame = await spec.parentContext(frame2)
      const resultDocument = await parentFrame.$('html')
      assert.ok(await isEqualElements(parentFrame, resultDocument, parentDocument))
    }
  }
  function childContext() {
    return async () => {
      const element = await page.$('[name="frame1"]')
      const expectedFrame = await page.frames().find(frame => frame.name() === 'frame1')
      const expectedDocument = await expectedFrame.$('html')
      const resultFrame = await spec.childContext(page.mainFrame(), element)
      const resultDocument = await resultFrame.$('html')
      assert.ok(await isEqualElements(resultFrame, resultDocument, expectedDocument))
    }
  }
  function findElement({input, expected} = {}) {
    return async () => {
      const result = expected !== undefined ? expected : await page.$(input)
      const element = await spec.findElement(page, input)
      if (element !== result) {
        assert.ok(await isEqualElements(page, element, result))
      }
    }
  }
  function findElements({input, expected} = {}) {
    return async () => {
      const result = expected !== undefined ? expected : await page.$$(input)
      const elements = await spec.findElements(page, input)
      assert.strictEqual(elements.length, result.length)
      for (const [index, element] of elements.entries()) {
        assert.ok(await isEqualElements(page, element, result[index]))
      }
    }
  }
  function getViewportSize() {
    return async () => {
      const expected = await page.viewport()
      const result = await spec.getViewportSize(page)
      assert.deepStrictEqual(result, expected)
    }
  }
  function setViewportSize({input, expected} = {}) {
    return async () => {
      await spec.setViewportSize(page, input)
      const actual = page.viewport()
      assert.deepStrictEqual(actual, expected)
    }
  }
  function getTitle() {
    return async () => {
      const expected = await page.title()
      const result = await spec.getTitle(page)
      assert.deepStrictEqual(result, expected)
    }
  }
  function getUrl() {
    return async () => {
      const result = await spec.getUrl(page)
      assert.deepStrictEqual(result, url)
    }
  }
  function visit() {
    return async () => {
      const blank = 'about:blank'
      await spec.visit(page, blank)
      const actual = await page.url()
      assert.deepStrictEqual(actual, blank)
      await page.goto(url)
    }
  }

  function getCookies(expected) {
    return async () => {
      await page.setCookie({name: 'hello', value: 'world'})
      assert.deepStrictEqual(await spec.getCookies(page), expected)
    }
  }
})
