# NOTE: this file is only used in generated coverage tests
require('logger')
require('selenium-webdriver')
require('eyes-selenium')

# NOTE: necessary evil to support Selenium 3.x on Ruby 3...
# re: https://github.com/SeleniumHQ/selenium/issues/9001
if (RUBY_VERSION.start_with?('3') && !::Selenium::WebDriver::VERSION.start_with?('4'))
  module Selenium
    module WebDriver
      module Remote
        class Bridge
          class << self
            alias_method :original_handshake, :handshake

            def handshake(opts = {})
              original_handshake(**opts)
            end
          end
        end
      end
    end
  end
end

RSpec.configure do |config|
  def build_driver(args = {})
    env = {
      url: 'http://localhost:4444/wd/hub',
      capabilities: {
        browserName: args[:browser] || 'chrome',
      }
    }
    ::Selenium::WebDriver.for(:remote, url: env[:url], desired_capabilities: env[:capabilities])
  end

  def eyes(args)
    @runner = Object.new
    class << @runner
      def get_all_test_results(*args)
        # no-op
      end
    end
    @eyes = ::Applitools::Selenium::Eyes.new
    @eyes.runner = @runner
    @eyes.configure do |config|
      config.api_key = ENV['APPLITOOLS_API_KEY']
      config.vg = !!args[:is_visual_grid]
      config.branch_name = args[:branch_name] || 'master'
    end
    @eyes
  end

  def eyes_config(args)
    @eyes.configure do |config|
      config.test_name = args[:baseline_name] if args[:baseline_name]
      config.stitch_mode = args[:stitch_mode] if args[:stitch_mode]
      config.hide_scrollbars = args[:hide_scrollbars] if args[:hide_scrollbars]
      config.browsers_info = args[:browsers_info] if args[:browsers_info]
      config.default_match_settings = args[:default_match_settings] if args[:default_match_settings]
    end
  end
end