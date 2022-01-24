const assert = require('assert')
const {lazyLoad, lazyLoadPollResult} = require('../dist/index')

describe('lazyLoad', () => {
  const url = 'https://applitools.github.io/demo/TestPages/SnippetsTestPage/'
  const options = [
    {
      scrollLength: 300,
      waitingTime: 1,
      pageHeight: 15000,
    },
  ]

  describe('chrome', () => {
    let page

    before(async function() {
      page = await global.getDriver('chrome')
      if (!page) {
        this.skip()
      }
    })

    it('works on a page that can scroll', async () => {
      await page.goto(url)
      await page.evaluate(
        () => window.scrollTo(0, 50)
      )
      const startingPosition = {x: 0, y: 50}
      const scrollableHeight = await page.evaluate(
        () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
      )
      await page.evaluate(lazyLoad, options)
      let transactionHistory
      do {
        transactionHistory = await page.evaluate(lazyLoadPollResult)
      } while (transactionHistory.status && transactionHistory.status === 'WIP')
      console.log(transactionHistory)
      const scrolledHeight = transactionHistory[transactionHistory.length - 1].y
      assert.deepStrictEqual(scrollableHeight, scrolledHeight)
      const afterScrollPosition = await page.evaluate(() => ({
        x: window.scrollX,
        y: window.scrollY,
      }))
      assert.deepStrictEqual(afterScrollPosition, startingPosition)
    })
  })

  for (const name of ['internet explorer', 'ios safari']) {
    describe(name, () => {
      let driver

      before(async function() {
        driver = await global.getDriver(name)
        if (!driver) {
          this.skip()
        }
      })

      it('works on a page that can scroll', async () => {
        await driver.url(url)
        await driver.execute(function() {
          window.scrollTo(0, 50)
        })
        const startingPosition = {x: 0, y: 50}
        const scrollableHeight = await driver.execute(function() {
          return document.documentElement.scrollHeight - document.documentElement.clientHeight
        })
        await driver.execute(lazyLoad, options)
        let transactionHistory
        do {
          transactionHistory = await driver.execute(lazyLoadPollResult)
        } while (transactionHistory.status && transactionHistory.status === 'WIP')
        console.log(transactionHistory)
        const scrolledHeight = transactionHistory[transactionHistory.length - 1].y
        assert(scrollableHeight - options.scrollLength <= scrolledHeight <= scrollableHeight)
        const afterScrollPosition = await driver.execute(function() {
          return {
            x: window.pageXOffset,
            y: document.documentElement.scrollTop,
          }
        })
        assert.deepStrictEqual(afterScrollPosition, startingPosition)
      })
    })
  }
})
