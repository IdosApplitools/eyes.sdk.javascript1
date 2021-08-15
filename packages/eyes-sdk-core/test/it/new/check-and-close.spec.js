const assert = require('assert')
const assertRejects = require('assert-rejects')
const {startFakeEyesServer} = require('@applitools/sdk-fake-eyes-server')
const Logger = require('../../../lib/logging/Logger')
const MockDriver = require('../../utils/MockDriver')
const spec = require('../../utils/FakeSpecDriver')
const makeSDK = require('../../../lib/new/sdk')

describe('checkAndClose', async () => {
  let server, serverUrl, driver, manager

  before(async () => {
    driver = new MockDriver()
    driver.mockElements([
      {selector: 'element0', rect: {x: 1, y: 2, width: 500, height: 501}},
      {selector: 'element1', rect: {x: 10, y: 11, width: 101, height: 102}},
      {selector: 'element2', rect: {x: 20, y: 21, width: 201, height: 202}},
      {selector: 'element3', rect: {x: 30, y: 31, width: 301, height: 302}},
      {selector: 'element4', rect: {x: 40, y: 41, width: 401, height: 402}},
    ])
    const core = new makeSDK({spec})
    server = await startFakeEyesServer({logger: new Logger(), matchMode: 'never'})
    serverUrl = `http://localhost:${server.port}`
    manager = await core.makeManager()
  })

  after(async () => {
    await server.close()
  })

  it('should not throw on close', async () => {
    const eyes = await manager.openEyes({
      driver,
      config: {appName: 'App', testName: 'Test', serverUrl, matchTimeout: 0, logs: {type: 'console'}},
    })
    const testResults = await eyes.checkAndClose({throwErr: false})
    console.log(testResults)
    assert.ok(Array.isArray(testResults))
  })

  it('should throw on close', async () => {
    const eyes = await manager.openEyes({driver, config: {appName: 'App', testName: 'Test', serverUrl}})
    await assertRejects(eyes.checkAndClose({throwErr: true}))
  })
})
