const {makeDriver, test} = require('../tests')

describe('screenshoter androidx app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', app: 'androidx', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full app screenshot (recycler view)', async () => {
    const button = await driver.element({type: 'id', selector: 'btn_recycler_view_in_scroll_view_activity'})
    await button.click()
    await driver.init()

    return test({
      type: 'android',
      tag: 'x-element-fully',
      region: {type: 'id', selector: 'recyclerView'},
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})
