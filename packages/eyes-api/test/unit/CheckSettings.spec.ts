import type * as types from '@applitools/types'
import {strict as assert} from 'assert'
import * as api from '../../src'

const makeSDK = require('../utils/fake-sdk')

describe('CheckSettings', () => {
  let sdk: types.Core<any, any, any> & {history: Record<string, any>[]; settings: Record<string, any>}

  class CheckSettings extends api.CheckSettings {
    protected static get _spec() {
      return sdk
    }
  }

  beforeEach(() => {
    sdk = makeSDK()
  })

  it('sets shadow selector with string', () => {
    const checkSettings = CheckSettings.shadow('el-with-shadow').region('el')
    assert.deepStrictEqual(checkSettings.toJSON(), {region: {selector: 'el-with-shadow', shadow: 'el'}})
  })

  it('sets shadow selector with framework selector', () => {
    const checkSettings = CheckSettings.shadow({fakeSelector: 'el-with-shadow'}).region({fakeSelector: 'el'})
    assert.deepStrictEqual(checkSettings.toJSON(), {
      region: {
        selector: {fakeSelector: 'el-with-shadow'},
        shadow: {fakeSelector: 'el'},
      },
    })
  })

  it('set waitBeforeCapture', () => {
    const checkSettings = new CheckSettings().waitBeforeCapture(1000)
    assert.equal(checkSettings.toJSON().waitBeforeCapture, 1000)
  })

  it('set lazyLoad with sensible defaults', () => {
    const checkSettings = new CheckSettings().lazyLoad()
    const lazyLoad = checkSettings.toJSON().lazyLoad
    assert.equal(lazyLoad.scrollLength, 300)
    assert.equal(lazyLoad.waitingTime, 2000)
    assert.equal(lazyLoad.pageHeight, 15000)
  })

  it('set lazyLoad', () => {
    const options = {
      scrollLength: 1,
      waitingTime: 1,
      pageHeight: 1
    }
    const checkSettings = new CheckSettings().lazyLoad(options)
    const lazyLoad = checkSettings.toJSON().lazyLoad
    assert.equal(lazyLoad.scrollLength, 1)
    assert.equal(lazyLoad.waitingTime, 1)
    assert.equal(lazyLoad.pageHeight, 1)
  })
})
