require('webdrivers/chromedriver')
require_relative('../lib/index')
require_relative('./spec_helper')
require('securerandom')

describe('e2e') do
  before(:all) do
    @batch = {id: SecureRandom.uuid, name: 'eyes-universal/rb e2e tests'}
  end
  before(:each) do
    options = ::Selenium::WebDriver::Chrome::Options.new
    options.add_argument('--headless')
    @driver = ::Selenium::WebDriver.for :chrome, options: options
    url = 'https://applitools.github.io/demo/TestPages/FramesTestPage/'
    @driver.get url
  end
  after(:each) do
    @driver.quit
  end
  describe('classic') do
    it('check window viewport') do
      eyes = ::Applitools::Selenium::Eyes.new
      eyes.open(@driver, {appName: 'eyes-selenium.rb', testName: 'classic, check window viewport', vg: false, batch: @batch})
      eyes.check({})
      eyes.close(true)
    end
    it('check window fully') do
      eyes = ::Applitools::Selenium::Eyes.new
      eyes.open(@driver, {appName: 'eyes-selenium.rb', testName: 'classic, check window fully', vg: false, batch: @batch})
      eyes.check({isFully: true})
      eyes.close(true)
    end
  end
  describe('vg') do
    it('check window viewport') do
      eyes = ::Applitools::Selenium::Eyes.new
      eyes.open(@driver, {appName: 'eyes-selenium.rb', testName: 'vg, check window viewport', vg: true, batch: @batch})
      eyes.check({})
      eyes.close(true)
    end
    it('check window fully') do
      eyes = ::Applitools::Selenium::Eyes.new
      eyes.open(@driver, {appName: 'eyes-selenium.rb', testName: 'vg, check window fully', vg: true, batch: @batch})
      eyes.check({isFully: true})
      eyes.close(true)
    end
  end
end
