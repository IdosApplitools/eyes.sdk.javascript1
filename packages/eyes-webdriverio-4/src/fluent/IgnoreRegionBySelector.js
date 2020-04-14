'use strict'

const {
  GetRegion,
  CoordinatesType,
  Location,
  Region,
  EyesUtils,
} = require('@applitools/eyes-sdk-core')
const {SelectorByLocator} = require('./SelectorByLocator')

class IgnoreRegionBySelector extends GetRegion {
  /**
   * @param {By} regionSelector
   */
  constructor(regionSelector) {
    super()
    this._selector = regionSelector
  }

  /**
   * @override
   * @param {Eyes} eyes
   * @param {EyesScreenshot} screenshot
   */
  async getRegion(eyes, screenshot) {
    const elements = await eyes.getDriver().finder.findElements(this._selector)

    const values = []
    if (elements && elements.length > 0) {
      for (let i = 0; i < elements.length; i += 1) {
        const point = await elements[i].getLocation()
        const size = await elements[i].getSize()
        const lTag = screenshot.convertLocation(
          new Location(point),
          CoordinatesType.CONTEXT_RELATIVE,
          CoordinatesType.SCREENSHOT_AS_IS,
        )
        values.push(new Region(lTag.getX(), lTag.getY(), size.getWidth(), size.getHeight()))
      }
    }

    return values
  }

  /**
   * @inheritDoc
   * @param {WDIODriver} driver
   * @return {Promise<string>}
   */
  async getSelector(driver) {
    return new SelectorByLocator(this._selector).getSelector(driver)
  }

  async toPersistedRegions(driver) {
    return EyesUtils.locatorToPersistedRegions(driver._logger, driver, this._selector)
  }
}

module.exports = IgnoreRegionBySelector
