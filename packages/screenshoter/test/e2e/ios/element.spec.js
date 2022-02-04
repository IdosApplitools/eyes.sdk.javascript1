const {makeDriver, test} = require('../tests')

describe('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take element screenshot', async () => {
    await test({
      type: 'ios',
      tag: 'element',
      region: {type: 'accessibility id', selector: 'Table view'},
      scrollingMode: 'scroll',
      driver,
      logger,
    })
  })
})
