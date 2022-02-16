'use strict'

const {describe, it, before, after, beforeEach} = require('mocha')
const {expect} = require('chai')
const puppeteer = require('puppeteer')
const makeRenderingGridClient = require('../../src/sdk/renderingGridClient')
const {testServerInProcess} = require('@applitools/test-server')
const {presult} = require('@applitools/functional-commons')
const {deserializeDomSnapshotResult} = require('@applitools/eyes-sdk-core/shared')
const {getProcessPageAndSerialize} = require('@applitools/dom-snapshot')
const fs = require('fs')
const {resolve} = require('path')
const testLogger = require('../util/testLogger')
const {getTestInfo} = require('@applitools/test-utils')

describe('eyesCheckWindowWithPageCover', () => {
  let baseUrl,
    closeServer,
    openEyes,
    pageId = 'my-page'
  const apiKey = process.env.APPLITOOLS_API_KEY // TODO bad for tests. what to do
  let browser, page
  let processPage

  beforeEach(() => {
    openEyes = makeRenderingGridClient({
      showLogs: process.env.APPLITOOLS_SHOW_LOGS,
      apiKey,
      fetchResourceTimeout: 2000,
      logger: testLogger,
    }).openEyes
  })

  before(async () => {
    if (!apiKey) {
      throw new Error('APPLITOOLS_API_KEY env variable is not defined')
    }
    const server = await testServerInProcess({port: 3458}) // TODO fixed port avoids 'need-more-resources' for dom. Is this desired? should both paths be tested?
    baseUrl = `http://localhost:${server.port}`
    closeServer = server.close

    browser = await puppeteer.launch()
    page = await browser.newPage()

    const processPageAndSerializeScript = await getProcessPageAndSerialize()
    processPage = () =>
      page.evaluate(`(${processPageAndSerializeScript})()`).then(deserializeDomSnapshotResult)
  })

  after(async () => {
    await closeServer()
    await browser.close()
  })

  before(async () => {
    if (process.env.APPLITOOLS_UPDATE_FIXTURES) {
      await page.goto(`${baseUrl}/test.html`)
      const {cdt} = await processPage()

      for (const el of cdt) {
        const attr = el.attributes && el.attributes.find(x => x.name === 'data-blob')
        if (attr) {
          if (el.nodeName === 'LINK') {
            const hrefAttr = el.attributes.find(x => x.name === 'href')
            hrefAttr.value = attr.value
          }

          if (el.nodeName === 'IMG') {
            const srcAttr = el.attributes.find(x => x.name === 'src')
            srcAttr.value = attr.value
          }
        }
      }

      const cdtStr = JSON.stringify(cdt, null, 2)
      fs.writeFileSync(resolve(__dirname, '../fixtures/test.cdt.json'), cdtStr)
    }
  })

  it(`adding pageId to 'eyes.check' should result pageCoverageInfo`, async () => {
    await page.goto(`${baseUrl}/test.html`)

    const {cdt, url, resourceContents, resourceUrls} = await processPage()

    const {checkWindow, close} = await openEyes({
      appName: 'some app including pageId',
      testName: 'added pageId to checkWindow',
      browser: [
        {width: 640, height: 480, name: 'chrome'},
        {width: 400, height: 600, name: 'firefox'},
      ],
      showLogs: process.env.APPLITOOLS_SHOW_LOGS,
    })

    const scriptHooks = {
      beforeCaptureScreenshot: "document.body.style.backgroundColor = 'gold'",
    }

    checkWindow({
      snapshot: {resourceUrls, resourceContents, cdt},
      tag: 'first',
      url,
      scriptHooks,
      target: 'region',
      //region: {width: 200, height: 400, x: 20, y: 77},
      selector: 'div[class*="auth-nested"]',
      //selector: 'div[class*="region"]',
      // ignore: [{selector: 'div[class*="bg-"]'}],
      // floating: [{selector: 'img[src*="smurfs.jpg"]', maxUpOffset: 3}],
      pageId,
    })

    const [errArr, results] = await presult(close())
    errArr && console.log(errArr)
    for (const [index, testResults] of results.entries()) {
      const testData = await getTestInfo(testResults.toJSON(), apiKey)
      console.log('testData', index, testData.actualAppOutput[0])
      expect(testData.actualAppOutput[0].pageCoverageInfo.pageId).to.eq(pageId, 'match pageId')
    }
  })
})
