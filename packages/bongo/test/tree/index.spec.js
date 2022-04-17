const assert = require('assert')
const {makeDependencyTree} = require('../../src/tree')

describe('tree', () => {
  it('creates a collection of packages sorted by publishing order', async () => {
    const pkgs = [
      {name: 'a', dependencies: { // types
        'h': '1'
      }},
      {name: 'b', dependencies: { // utils
        'h': '1'
      }},
      {name: 'c', dependencies: { // logger
        'h': '1'
      }},
      {name: 'd', dependencies: { // test-utils
        'h': '1'
      }},
      {name: 'e', dependencies: { // snippets
        'h': '1'
      }},
      {name: 'f', dependencies: { // spec-driver-selenium
        'a': '1',
        'b': '1',
        'h': '1',
      }},
      {name: 'g', dependencies: { // eyes-api
        'a': '1',
        'h': '1',
      }},
      {name: 'h', dependencies: { // bongo
        'b': '1',
      }},
      {name: 'i', dependencies: { // driver
        'a': '1',
        'b': '1',
        'e': '1',
        'h': '1',
      }},
      {name: 'j', dependencies: { // screenshoter
        'b': '1',
        'e': '1',
        'h': '1',
      }},
      {name: 'k', dependencies: { // core
        'a': '1',
        'i': '1',
        'c': '1',
        'j': '1',
        'e': '1',
        'h': '1',
        'd': '1',
      }},
      {name: 'l', dependencies: { // vgc
        'k': '1',
        'c': '1',
        'h': '1',
        'd': '1',
      }},
      {name: 'm', dependencies: { // eyes-selenium
        'f': '1',
        'g': '1',
        'k': '1',
        'l': '1',
        'h': '1',
        'd': '1',
      }},
      {name: 'n', dependencies: { // universal
        'k': '1',
        'l': '1',
        'c': '1',
        'h': '1',
        'd': '1',
      }},
      {name: 'o', dependencies: { // eyes-cypress
        'g': '1',
        'n': '1',
        'c': '1',
        'l': '1',
        'h': '1',
        'd': '1',
      }},
    ]
    const result = makeDependencyTree(pkgs)
    assert.deepStrictEqual(result, [
      [ 'b' ],                  // utils
      [ 'h' ],                  // bongo
      [ 'a', 'e' ],             // types, snippets
      [ 'i', 'c', 'j', 'd' ],   // driver, logger, screenshoter, test-utils
      [ 'k' ],                  // core
      [ 'l' ],                  // vgc
      [ 'f', 'g', 'n' ],        // sp-sel, eyes-api, universal
      [ 'm', 'o' ]              // sel, cy
    ])
  })
})
