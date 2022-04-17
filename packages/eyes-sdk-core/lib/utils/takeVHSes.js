async function getNativeElementBySelector({driver, selector, type, timeout = 0, throwErr = true}) {
  const context = driver.currentContext
  let nativeElement
  if (driver.isAndroid) {
    nativeElement = await driver.element({
      type: 'xpath',
      selector: `//android.widget.${type}[@content-desc="${selector}" and @displayed="true"]`,
    })
  } else {
    nativeElement = await context.waitFor({type: 'accessibility id', selector}, {timeout})
  }
  if (!nativeElement && throwErr) {
    throwError(`${selector} element could not be found`)
  }
  return nativeElement
}

async function takeVHSes({driver, browsers, apiKey, serverUrl, proxy, waitBeforeCapture, logger}) {
  log('taking VHS')

  if (!driver.isAndroid && !driver.isIOS) {
    throwError('cannot take VHS on mobile device other than iOS or Android')
  }

  if (waitBeforeCapture) await waitBeforeCapture()

  const trigger = await getNativeElementBySelector({
    driver,
    selector: 'UFG_TriggerArea',
    type: 'Button',
    timeout: 30000,
  })

  if (driver.isAndroid) {
    const apiKeyInput = await getNativeElementBySelector({
      driver,
      selector: 'UFG_Apikey',
      type: 'EditText',
      throwErr: false,
    })
    if (apiKeyInput) {
      // in case 'apiKeyInput' does not exist, it means it was already triggered on previous cycle
      // this condition is to avoid re-sending 'inputJson' multiple times
      const proxyObject = proxy && proxy.toProxyObject()
      const inputJson = {
        apiKey,
      }
      if (serverUrl) inputJson.serverUrl = serverUrl
      if (proxyObject) inputJson.proxy = proxyObject
      const inputString = JSON.stringify(inputJson)
      log('sending API key to UFG lib', inputString)
      await apiKeyInput.type(inputString)
      const ready = await getNativeElementBySelector({
        driver,
        selector: 'UFG_ApikeyReady',
        type: 'Button',
      })
      await ready.click()
    } else {
      log('UFG_Apikey was skipped')
    }
  }

  await trigger.click() // TODO handle stale element exception and then find the trigger again and click it

  const label = await getNativeElementBySelector({
    driver,
    selector: 'UFG_SecondaryLabel',
    type: 'TextView',
    timeout: 10000,
  })
  const info = JSON.parse(await label.getText())

  log('VHS info', info)

  if (info.error) {
    throwError(info.error)
  }

  let vhs
  if (driver.isIOS) {
    vhs = await extractVHS()
  } else if (info.mode === 'labels') {
    vhs = await collectChunkedVHS({count: info.partsCount})
  } else if (info.mode === 'network') {
    // do nothing
  } else {
    throwError(`unknown mode for android: ${info.mode}`)
  }

  const clear = await getNativeElementBySelector({
    driver,
    selector: 'UFG_ClearArea',
    type: 'Button',
  })
  await clear.click()

  let snapshot

  if (driver.isAndroid) {
    snapshot = {
      platformName: 'android',
      vhsType: info.flavorName,
      vhsHash: {
        hashFormat: 'sha256',
        hash: info.vhsHash,
        contentType: `x-applitools-vhs/${info.flavorName}`,
      },
    }
  } else {
    snapshot = {
      platformName: 'ios',
      resourceContents: {
        vhs: {
          value: Buffer.from(vhs, 'base64'),
          type: 'x-applitools-vhs/ios',
        },
      },
      vhsCompatibilityParams: {
        UIKitLinkTimeVersionNumber: info.UIKitLinkTimeVersionNumber,
        UIKitRunTimeVersionNumber: info.UIKitRunTimeVersionNumber,
      },
    }
  }

  return {snapshots: Array(browsers.length).fill(snapshot)}

  async function extractVHS() {
    const label = await getNativeElementBySelector({
      driver,
      selector: 'UFG_Label',
      type: 'TextView',
    })
    return await label.getText()
  }

  async function collectChunkedVHS({count}) {
    const labels = [
      await getNativeElementBySelector({
        driver,
        selector: 'UFG_Label_0',
        type: 'TextView',
      }),
      await getNativeElementBySelector({
        driver,
        selector: 'UFG_Label_1',
        type: 'TextView',
      }),
      await getNativeElementBySelector({
        driver,
        selector: 'UFG_Label_2',
        type: 'TextView',
      }),
    ]

    let vhs = ''
    for (let chunk = 0; chunk < count / labels.length; ++chunk) {
      for (let label = 0; label < Math.min(labels.length, count - chunk * labels.length); ++label) {
        vhs += await labels[label].getText()
      }

      if (chunk * labels.length < count) {
        await trigger.click()
      }
    }
    return vhs
  }

  function log(...msg) {
    logger.log('[takeVHSes]', ...msg)
  }
}

function throwError(msg) {
  throw new Error(`Error while taking VHS - ${msg}`)
}

module.exports = takeVHSes
