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

  describe('lazyLoad', () => {
    const defaultOptions = {
      scrollLength: 300,
      waitingTime: 2000,
      pageHeight: 15000
    }

    it('set lazyLoad with sensible defaults', () => {
      const checkSettings = new CheckSettings().lazyLoad()
      const lazyLoadOptions = checkSettings.toJSON().lazyLoad
      assert.deepStrictEqual(lazyLoadOptions, defaultOptions)
    })

    it('set lazyLoad with user options', () => {
      const options = {
        scrollLength: 1,
        waitingTime: 2,
        pageHeight: 3
      }
      const checkSettings = new CheckSettings().lazyLoad(options)
      const lazyLoadOptions = checkSettings.toJSON().lazyLoad
      assert.deepStrictEqual(lazyLoadOptions, options)
    })

    it('set lazyLoad partial', () => {
      let lazyLoad, checkSettings
      checkSettings = new CheckSettings().lazyLoad({
        scrollLength: 1,
        waitingTime: 2,
      })
      lazyLoad = checkSettings.toJSON().lazyLoad
      assert.equal(lazyLoad.scrollLength, 1)
      assert.equal(lazyLoad.waitingTime, 2)
      assert.equal(lazyLoad.pageHeight, defaultOptions.pageHeight)

      checkSettings = new CheckSettings().lazyLoad({
        scrollLength: 1,
        pageHeight: 3,
      })
      lazyLoad = checkSettings.toJSON().lazyLoad
      assert.equal(lazyLoad.scrollLength, 1)
      assert.equal(lazyLoad.waitingTime, defaultOptions.waitingTime)
      assert.equal(lazyLoad.pageHeight, 3)

      checkSettings = new CheckSettings().lazyLoad({
        waitingTime: 2,
        pageHeight: 3,
      })
      lazyLoad = checkSettings.toJSON().lazyLoad
      assert.equal(lazyLoad.scrollLength, defaultOptions.scrollLength)
      assert.equal(lazyLoad.waitingTime, 2)
      assert.equal(lazyLoad.pageHeight, 3)
    })
  })
})
