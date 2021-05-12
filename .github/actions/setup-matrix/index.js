const core = require('@actions/core')

const PACKAGES = {
  'utils': {
    aliases: ['@applitools/utils'],
    dirname: 'utils',
  },
  'logger': {
    aliases: ['@applitools/logger'],
    dirname: 'logger',
  },
  'driver': {
    aliases: ['@applitools/driver'],
    dirname: 'driver',
  },
  'screenshoter': {
    aliases: ['@applitools/screenshoter'],
    dirname: 'screenshoter',
  },
  'api': {
    aliases: ['@applitools/eyes-api'],
    dirname: 'eyes-api',
  },
  'core': {
    aliases: ['@applitools/eyes-sdk-core'],
    dirname: 'eyes-sdk-core',
  },
  'vgc': {
    aliases: ['@applitools/visual-grid-client'],
    dirname: 'visual-grid-client',
  },

  'playwright': {
    aliases: ['@applitools/eyes-playwright'],
    dirname: 'eyes-playwright',
    framework: 'playwright',
    sdk: true,
  },
  'puppeteer': {
    aliases: ['pptr', '@applitools/eyes-puppeteer'],
    dirname: 'eyes-puppeteer',
    framework: 'puppeteer',
    sdk: true,
  },
  'webdriverio': {
    aliases: ['wdio', 'eyes-webdriverio', '@applitools/eyes-webdriverio'],
    dirname: 'eyes-webdriverio-5',
    framework: 'webdriverio',
    sdk: true,
  },
  'webdriverio-legacy': {
    aliases: ['wdio-legacy', 'eyes.webdriverio', '@applitools/eyes.webdriverio'],
    dirname: 'eyes-webdriverio-4',
    framework: 'webdriverio',
    sdk: true,
  },
  'selenium': {
    aliases: ['@applitools/eyes-selenium'],
    dirname: 'eyes-selenium',
    framework: 'selenium-webdriver',
    sdk: true,
  },
  'protractor': {
    aliases: ['@applitools/eyes-protractor'],
    dirname: 'eyes-protractor',
    framework: 'protractor',
    sdk: true,
  },
  'nightwatch': {
    aliases: ['@applitools/eyes-nightwatch'],
    dirname: 'eyes-nightwatch',
    framework: 'nightwatch',
    sdk: true,
  },
  'testcafe': {
    aliases: ['@applitools/eyes-testcafe'],
    dirname: 'eyes-testcafe',
    framework: 'testcafe',
    sdk: true,
  },
}

const packageSettings = core.getInput('packages', {required: true})
const allowModifiers = core.getInput('allow-modifiers')
const defaultReleaseVersion = core.getInput('release-version')

const output = packageSettings.split(/[\s,]+/).reduce((output, packageSetting) => {
  let [_, packageKey, releaseVersion, frameworkVersion, frameworkProtocol]
    = packageSetting.match(/^(.*?)(?::(patch|minor|major))?(?:@([\d.]+))?(?:\+(.+?))?$/i)
  console.log(packageKey, releaseVersion, frameworkVersion, frameworkProtocol)
  console.log(defaultReleaseVersion)
  releaseVersion = releaseVersion || defaultReleaseVersion
  const packageName = Object.keys(PACKAGES).find(packageName => {
    return packageName === packageKey || packageName.dirname === packageKey || PACKAGES[packageName].aliases.includes(packageKey)
  })
  const packageInfo = PACKAGES[packageName]
  if (!packageInfo) {
    console.warn(`Package name is unknown! Package configured as "${packageSetting}" will be ignored!`)
    return output
  }
  if (allowModifiers) {
    if (!packageInfo.sdk && (frameworkVersion | frameworkProtocol)) {
      console.warn(`Framework modifiers are not allowed for package "${packageName}"! Package configured as "${packageSetting}" will be ignored!`)
      return output
    }
  } else {
    if (frameworkVersion | frameworkProtocol) {
      console.warn(`Modifiers are not allowed! Package configured as "${packageSetting}" will be ignored!`)
      return output
    }
  }


  const modifiers = Object.entries({version: frameworkVersion, protocol: frameworkProtocol})
    .reduce((parts, [key, value]) => value ? [...parts, `${key}: ${value}`] : parts, [])
    .join('; ')
  output[packageName] = {
    displayName: `${packageName}${releaseVersion ? `:${releaseVersion}` : ''}${modifiers ? ` (${modifiers})` : ''}`,
    name: packageName,
    package: packageInfo.dirname,
    sdk: packageInfo.sdk,
    install: frameworkVersion ? `${packageName.framework}@${frameworkVersion}` : '',
    releaseVersion,
    env: {
      [`APPLITOOLS_${packageName.toUpperCase()}_MAJOR_VERSION`]: frameworkVersion,
      [`APPLITOOLS_${packageName.toUpperCase()}_PROTOCOL`]: frameworkProtocol
    }
  }
  return output
}, {})

core.setOutput('sdk-matrix', {include: Object.values(output).filter(pkg => pkg.sdk)})
core.setOutput('packages', output)
