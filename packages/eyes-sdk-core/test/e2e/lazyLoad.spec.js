const VisualGridClient = require('@applitools/visual-grid-client')
const spec = require('@applitools/spec-driver-selenium')
const {makeSDK} = require('../../index')

describe('lazyLoad', () => {
  let driver, destroyDriver, manager, eyes

  const sdk = makeSDK({
    name: 'eyes-core',
    version: require('../../package.json').version,
    spec,
    VisualGridClient,
  })

  afterEach(async () => {
    if (destroyDriver) await destroyDriver()
    if (eyes) await eyes.abort()
    await manager.closeAllEyes()
  })

  describe('vg', () => {
    beforeEach(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
      manager = await sdk.makeManager({type: 'vg', concurrency: 5})
    })

    it('test lazyLoad with layoutBreakpoints - checkSettings', async () => {
      const config = {
        appName: 'core app',
        testName: 'lazyLoad with layoutbreakpoints - checkSettings',
        layoutBreakpoints: true,
        matchTimeout: 0,
        saveNewTests: false,
        viewportSize: {width: 800, height: 600},
        browsersInfo: [{name: 'chrome', width: 1000, height: 600}],
      }
      const settings = {
        fully: true,
        lazyLoad: {},
      }
      eyes = await manager.openEyes({driver, config})
      await driver.get('https://applitools.github.io/demo/TestPages/LazyLoad/')
      await eyes.check({settings})
      await eyes.close({throwErr: true})
    })
  })

  describe('classic', () => {
    beforeEach(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
      manager = await sdk.makeManager()
    })

    it('test lazyLoad with classic - checkSettings', async () => {
      const config = {
        appName: 'core app',
        testName: 'lazyLoad with classic - checkSettings',
        matchTimeout: 0,
        saveNewTests: false,
        viewportSize: {width: 800, height: 600},
      }
      const settings = {
        fully: true,
        lazyLoad: {},
      }
      eyes = await manager.openEyes({driver, config})
      await driver.get('https://applitools.github.io/demo/TestPages/LazyLoad/')
      await eyes.check({settings})
      await eyes.close({throwErr: true})
    })
  })
})
