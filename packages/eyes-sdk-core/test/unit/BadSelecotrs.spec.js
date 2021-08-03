const assert = require('assert')
const {startFakeEyesServer} = require('@applitools/sdk-fake-eyes-server')
const MockDriver = require('../utils/MockDriver')
const {EyesFactory} = require('../utils/FakeSDK')

describe('Bad Selectors', () => {
  let server, serverUrl, driver, eyes

  before(async () => {
    driver = new MockDriver()
    driver.mockElement('element0')
    eyes = new EyesFactory()
    server = await startFakeEyesServer({logger: eyes._logger, matchMode: 'always'})
    serverUrl = `http://localhost:${server.port}`
    eyes.setServerUrl(serverUrl)
  })

  after(async () => {
    await server.close()
  })

  afterEach(async () => {
    await eyes.abort()
  })

  it('check region with bad selector', async () => {
    await eyes.open(driver, 'FakeApp', 'FakeTest')
    // eslint-disable-next-line
    await assert.rejects(eyes.check({region: 'element that does not exist'}), error => {
      return error.message === 'Element not found!'
    })
  })

  it('test check region with bad ignore selector', async () => {
    await eyes.open(driver, 'FakeApp', 'FakeTest')
    await eyes.check('', {ignoreRegions: ['element that does not exist']})
    await eyes.close()
  })
})
