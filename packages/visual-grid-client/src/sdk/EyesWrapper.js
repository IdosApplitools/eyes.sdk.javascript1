'use strict'
const {EyesBase, NullRegionProvider} = require('@applitools/eyes-sdk-core')
const {presult} = require('@applitools/functional-commons')
const createEmulationInfo = require('./createEmulationInfo')
const VERSION = require('../../package.json').version

class EyesWrapper extends EyesBase {
  constructor({apiKey, logHandler, getBatchInfoWithCache, getRendererInfo} = {}) {
    super()
    apiKey && this.setApiKey(apiKey)
    logHandler && this.setLogHandler(logHandler)
    this._getBatchInfoWithCache = getBatchInfoWithCache
    this._getRendererInfo = getRendererInfo
  }

  async open({appName, testName, viewportSize, skipStartingSession}) {
    await super.openBase(appName, testName, undefined, undefined, skipStartingSession)

    if (viewportSize) {
      this.setViewportSize(viewportSize)
    }
  }

  async ensureRunningSession() {
    if (!this.getRunningSession()) {
      if (!this._ensureRunningSessionPromise) {
        this._ensureRunningSessionPromise = this._ensureRunningSession()
      }
      await this.populateRendererInfo()
      const [err] = await presult(this._ensureRunningSessionPromise)
      this._ensureRunningSessionPromise = null
      if (err) {
        this._logger.log(
          'failed to ensure a running session (probably due to a previous fatal error)',
          err,
        )
      }
    }
  }

  async populateRendererInfo(browser) {
    if (!this._populateRendererInfoPromise) {
      const {
        width,
        height,
        name,
        deviceName,
        screenOrientation,
        deviceScaleFactor,
        mobile,
        platform,
        iosDeviceInfo,
      } = browser
      const emulationInfo = createEmulationInfo({
        deviceName,
        screenOrientation,
        deviceScaleFactor,
        mobile,
        width,
        height,
      })
      const filledBrowserName = iosDeviceInfo && !name ? 'safari' : name
      const filledPlatform = iosDeviceInfo && !platform ? 'ios' : platform
      this._populateRendererInfoPromise = this._getRendererInfo({
        platform: {name: filledPlatform},
        browser: {name: filledBrowserName},
        renderInfo: {
          emulationInfo,
          iosDeviceInfo,
        },
      }).then(({eyesEnvironment, rendererIdentifier}) => {
        this._appEnvironment = eyesEnvironment
        this._rendererIdentifier = rendererIdentifier
      })
    }
    return this._populateRendererInfoPromise
  }

  async ensureAborted() {
    await this.ensureRunningSession()
    await this.abort()
  }

  async getScreenshot() {
    return
  }

  async getScreenshotUrl() {
    return this.screenshotUrl
  }

  getRendererIdentifier() {
    return this._rendererIdentifier
  }

  getAppEnvironment() {
    return this._appEnvironment
  }

  async getInferredEnvironment() {
    return this.inferredEnvironment
  }

  async setViewportSize(viewportSize) {
    this._configuration.setViewportSize(viewportSize)
    this._viewportSizeHandler.set(this._configuration.getViewportSize())
  }

  async getTitle() {
    return 'some title' // TODO what should this be? is it connected with the tag in `checkWindow` somehow?
  }

  async getDomUrl() {
    return this.domUrl
  }

  async getImageLocation() {
    return this.imageLocation
  }

  /**
   * Get the AUT session id.
   *
   * @return {Promise<?String>}
   */
  async getAUTSessionId() {
    return // TODO is this good?
  }

  /** @override */
  getBaseAgentId() {
    return this._baseAgentId || `visual-grid-client/${VERSION}`
  }

  setBaseAgentId(baseAgentId) {
    this._baseAgentId = baseAgentId
  }

  setAccessibilityValidation(value) {
    this._configuration.getDefaultMatchSettings().setAccessibilitySettings(value)
  }

  /**
   * Get a RenderingInfo from eyes server
   *
   * @return {Promise<RenderingInfo>}
   */
  getRenderInfo() {
    return this._serverConnector.renderInfo()
  }

  setRenderingInfo(renderingInfo) {
    this._serverConnector.setRenderingInfo(renderingInfo)
  }

  /**
   * Create a screenshot of a page on RenderingGrid server
   *
   * @param {RenderRequest[]} renderRequests - The requests to be sent to the rendering grid
   * @return {Promise<String[]>} - The results of the render
   */
  renderBatch(renderRequests) {
    renderRequests.forEach(rr => rr.setAgentId(this.getBaseAgentId()))
    return this._serverConnector.render(renderRequests)
  }

  checkResources(resources) {
    return this._serverConnector.renderCheckResources(resources)
  }

  getRendererInfo(renderRequests) {
    return this._serverConnector.renderGetRendererInfo(renderRequests)
  }

  putResource(resource) {
    return this._serverConnector.renderPutResource(resource)
  }

  getRenderStatus(renderId) {
    return this._serverConnector.renderStatusById(renderId)
  }

  logEvents(events) {
    return this._serverConnector.logEvents(events)
  }

  checkWindow({screenshotUrl, tag, domUrl, checkSettings, imageLocation, url}) {
    const regionProvider = new NullRegionProvider()
    this.screenshotUrl = screenshotUrl
    this.domUrl = domUrl
    this.imageLocation = imageLocation
    return this.checkWindowBase(regionProvider, tag, false, checkSettings, url)
  }

  setProxy(proxy) {
    if (proxy.uri !== undefined) {
      proxy.url = proxy.uri // backward compatible
    }
    super.setProxy(proxy)
  }

  setInferredEnvironment(value) {
    this.inferredEnvironment = value
  }

  async getAndSaveRenderingInfo() {
    // Do nothing because visual grid client handles rendering info
  }

  async _getAndSaveBatchInfoFromServer(batchId) {
    return this._getBatchInfoWithCache(batchId)
  }
}

module.exports = EyesWrapper
