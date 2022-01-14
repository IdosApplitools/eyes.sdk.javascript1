const assert = require('assert')
const {lazyLoad, getDocumentSize} = require('../dist/index')

describe('lazyLoad', () => {
  const url = 'https://applitools.github.io/demo/TestPages/SnippetsTestPage/'

  describe('chrome', () => {
    let page

    before(async function() {
      page = await global.getDriver('chrome')
      if (!page) {
        this.skip()
      }
    })

    it('works on a page that can scroll', async () => {
      const options = {
        scrollLength: 300,
        waitingTime: 10,
        pageHeight: 15000,
      }
      await page.goto(url)
      const {height: pageHeight} = await page.evaluate(getDocumentSize)
      const transactionHistory = await page.evaluate(lazyLoad, [options])
      console.log(transactionHistory)
      assert.deepStrictEqual(pageHeight, transactionHistory[transactionHistory.length - 1].y)
      const afterScrollPosition = await page.evaluate(() => ({
        x: window.scrollX,
        y: window.scrollY,
      }))
      assert.deepStrictEqual(afterScrollPosition, {x: 0, y: 0})
    })
  })

  //for (const name of ['internet explorer', 'ios safari']) {
  //  describe(name, () => {
  //    let driver

  //    before(async function() {
  //      driver = await global.getDriver(name)
  //      if (!driver) {
  //        this.skip()
  //      }
  //    })

  //    it('specific element', async () => {
  //      await driver.url(url)
  //      const element = await driver.$('#scrollable')
  //      await driver.execute(scrollTo, [element, {x: 10, y: 11}])
  //      const offset = await driver.execute(function(element) {
  //        return {x: element.scrollLeft, y: element.scrollTop}
  //      }, element)
  //      assert.deepStrictEqual(offset, {x: 10, y: 11})
  //    })

  //    it('default element', async () => {
  //      await driver.url(url)
  //      await driver.execute(scrollTo, [undefined, {x: 10, y: 11}])
  //      const offset = await driver.execute(function() {
  //        return {
  //          x: document.documentElement.scrollLeft,
  //          y: document.documentElement.scrollTop,
  //        }
  //      })
  //      assert.deepStrictEqual(offset, {x: 10, y: 11})
  //    })
  //  })
  //}
})
