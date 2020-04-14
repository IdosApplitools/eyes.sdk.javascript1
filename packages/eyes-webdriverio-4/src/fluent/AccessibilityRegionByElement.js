'use strict'

const {
  GetAccessibilityRegion,
  AccessibilityMatchSettings,
  Location,
  CoordinatesType,
  EyesUtils,
} = require('@applitools/eyes-sdk-core')
const WDIOElement = require('../wrappers/WDIOElement')
class AccessibilityRegionByElement extends GetAccessibilityRegion {
  /**
   * @param {WDIOElement|object} element
   * @param {AccessibilityRegionType} regionType
   */
  constructor(element, regionType) {
    super()
    this._element = element
    this._regionType = regionType
  }

  /**
   * @inheritDoc
   * @param {Eyes} eyes
   * @param {EyesScreenshot} screenshot
   * @return {Promise<AccessibilityMatchSettings[]>}
   */
  // eslint-disable-next-line
  async getRegion(eyes, screenshot) {
    this._element = new WDIOElement(eyes._logger, eyes.getDriver(), this._element)
    const point = await this._element.getLocation()
    const size = await this._element.getSize()
    const pTag = screenshot.convertLocation(
      new Location(point),
      CoordinatesType.CONTEXT_RELATIVE,
      CoordinatesType.SCREENSHOT_AS_IS,
    )

    const accessibilityRegion = new AccessibilityMatchSettings({
      left: pTag.getX(),
      top: pTag.getY(),
      width: size.getWidth(),
      height: size.getHeight(),
      type: this._regionType,
    })
    return [accessibilityRegion]
  }

  async toPersistedRegions(driver) {
    const xpath = await EyesUtils.getElementXpath(driver._logger, driver.executor, this._element)
    return [
      {
        type: 'xpath',
        selector: xpath,
        accessibilityType: this._regionType,
      },
    ]
  }
}

module.exports = AccessibilityRegionByElement
