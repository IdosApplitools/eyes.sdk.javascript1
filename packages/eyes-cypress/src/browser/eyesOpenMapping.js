const batchPropertiesRetriever = (args, appliConfFile) => {
  return function(prop, nestedProp) {
    nestedProp = nestedProp || prop;
    return (
      args[prop] ||
      (args.batch ? args.batch[nestedProp] : undefined) ||
      appliConfFile[prop] ||
      (appliConfFile.batch ? appliConfFile.batch[nestedProp] : undefined)
    );
  };
};
function eyesOpenMapValues({args, appliConfFile, testName, shouldUseBrowserHooks}) {
  let browsersInfo = args.browser || appliConfFile.browser;
  let accessibilitySettings = args.accessibilityValidation || appliConfFile.accessibilityValidation;
  const batchProperties = batchPropertiesRetriever(args, appliConfFile);
  const batch = {
    id: batchProperties('batchId', 'id'),
    name: batchProperties('batchName', 'name'),
    sequenceName: batchProperties('batchSequenceName', 'sequenceName'),
    notifyOnCompletion: batchProperties('notifyOnCompletion'),
    properties:
      (args.batch ? args.batch.properties : undefined) ||
      (appliConfFile.batch ? appliConfFile.batch.properties : undefined),
  };
  for (let prop in batch) {
    if (!batch[prop]) {
      delete batch[prop];
    }
  }

  const mappedValues = [
    'accessibilityValidation',
    'browser',
    'useDom',
    'matchLevel',
    'enablePatterns',
    'ignoreDisplacements',
    'ignoreCaret',
    'batchName',
    'batchId',
    'batchSequenceName',
  ];

  if (browsersInfo) {
    if (Array.isArray(browsersInfo)) {
      browsersInfo.forEach(fillDefaultBrowserName);
    } else {
      fillDefaultBrowserName(browsersInfo);
      browsersInfo = [browsersInfo];
    }
  }

  const defaultMatchSettings = {
    accessibilitySettings,
    matchLevel: args.matchLevel || appliConfFile.matchLevel,
    ignoreCaret: args.ignoreCaret || appliConfFile.ignoreCaret,
    useDom: args.useDom || appliConfFile.useDom,
    enablePatterns: args.enablePatterns || appliConfFile.enablePatterns,
    ignoreDisplacements: args.ignoreDisplacements || appliConfFile.ignoreDisplacements,
  };

  const appliConfFileCopy = {...appliConfFile};
  for (const val of mappedValues) {
    if (args.hasOwnProperty(val)) {
      delete args[val];
    }
    if (appliConfFileCopy.hasOwnProperty(val)) {
      delete appliConfFileCopy[val];
    }
  }

  const mappedArgs = {
    ...args,
    browsersInfo,
    defaultMatchSettings,
    batch,
  };

  return Object.assign(
    {testName, dontCloseBatches: !shouldUseBrowserHooks},
    appliConfFileCopy,
    mappedArgs,
  );
}

function fillDefaultBrowserName(browser) {
  if (!browser.name && !browser.iosDeviceInfo && !browser.chromeEmulationInfo) {
    browser.name = 'chrome';
  }
}

module.exports = {eyesOpenMapValues};
