const {VisualGridRunner} = require('@applitools/eyes-sdk-core')
const {EyesFactory} = require('../../src/TestCafeSDK')
const eyes = new EyesFactory(new VisualGridRunner())
const assert = require('assert')

fixture`legacy vg api`.after(async () => {
  if (eyes.getIsOpen()) await eyes.close(false)
})
test('eyes.open with init params', async driver => {
  assert.doesNotThrow(async () => {
    await eyes.open({t: driver, appName: 'app-name', testName: 'test-name'})
  })
})
test('eyes.open with config params', async driver => {
  const init = {
    t: driver,
    appName: 'app-name',
    testName: 'test-name',
  }
  const browser = [{width: 1024, height: 768, name: 'ie11'}]
  const concurrency = 1
  const batchName = 'blah'
  assert.doesNotThrow(async () => {
    await eyes.open({
      ...init,
      browser,
      concurrency,
      batchName,
    })
  })
  const config = eyes.getConfiguration()
  console.log(config)
  assert.deepStrictEqual(config.getBrowsersInfo(), browser)
})
