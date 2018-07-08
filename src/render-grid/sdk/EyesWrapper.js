'use strict';
const {
  EyesBase,
  RectangleSize,
  NullRegionProvider,
  CheckSettings,
} = require('@applitools/eyes.sdk.core');

const VERSION = require('../../../package.json').version;

class EyesWrapper extends EyesBase {
  constructor({apiKey, logHandler} = {}) {
    super();
    this.setApiKey(apiKey);
    logHandler && this.setLogHandler(logHandler);
  }

  async open(appName, testName, viewportSize, browserName) {
    await super.openBase(appName, testName);
    browserName && this.setHostApp(browserName);

    this._viewportSizeHandler.set(new RectangleSize(viewportSize)); // Not doing this causes an exception at a later
  }

  /** @override */
  getBaseAgentId() {
    return `eyes.cypress/${VERSION}`; // TODO is this good? this class isn't called EyesCypressImpl anymore
  }

  /**
   * Get the AUT session id.
   *
   * @return {Promise<?String>}
   */
  getAUTSessionId() {
    return this.getPromiseFactory().resolve(undefined); // TODO is this good?
  }

  /**
   * Get a RenderingInfo from eyes server
   *
   * @return {Promise.<RenderingInfo>}
   */
  async getRenderInfo() {
    return this._serverConnector.renderInfo();
  }

  setRenderingInfo(renderingInfo) {
    this._serverConnector.setRenderingAuthToken(renderingInfo.getAccessToken());
    this._serverConnector.setRenderingServerUrl(renderingInfo.getServiceUrl());
  }

  /**
   * Create a screenshot of a page on RenderingGrid server
   *
   * @param {RenderRequest[]} renderRequests The requests to be sent to the rendering grid
   * @return {Promise.<String[]>} The results of the render
   */
  async renderBatch(renderRequests) {
    return await this._renderWindowTask.postRenderBatch(renderRequests);
  }

  async putResources(rGridDom, runningRender) {
    return await this._renderWindowTask.putResources(rGridDom, runningRender);
  }

  async getRenderStatus(renderId) {
    return await this._serverConnector.renderStatusById(renderId);
  }

  async checkWindow({screenshotUrl, tag}) {
    const regionProvider = new NullRegionProvider(this.getPromiseFactory()); // TODO receive from outside?
    const checkSettings = new CheckSettings(0); // TODO receieve from outside?
    this.screenshotUrl = screenshotUrl;
    return await this.checkWindowBase(regionProvider, tag, false, checkSettings);
  }

  async getScreenshot() {
    return await undefined; // TODO will I ever need this?
  }

  async getScreenshotUrl() {
    return await this.screenshotUrl;
  }

  async getInferredEnvironment() {
    return await ''; // TODO what does this mean? should there be something meaningful here?
  }

  async getTitle() {
    return await 'some title'; // TODO what should this be? is it connected with the tag in `checkWindow` somehow?
  }
}

module.exports = EyesWrapper;
