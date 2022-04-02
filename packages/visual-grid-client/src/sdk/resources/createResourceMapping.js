'use strict'

const createResource = require('./createResource')
const createDomResource = require('./createDomResource')
const createVHSResource = require('./createVHSResource')

function makeCreateResourceMapping({processResources}) {
  return async function createResourceMapping({
    snapshot,
    browserName,
    userAgent,
    cookies,
    proxy,
    autProxy,
  }) {
    const processedSnapshotResources = await processSnapshotResources({
      snapshot,
      browserName,
      userAgent,
      cookies,
      proxy,
      autProxy,
    })

    const resources = await processedSnapshotResources.promise

    const dom = resources[snapshot.url || 'vhs']
    if (snapshot.url) {
      delete resources[snapshot.url]
    }

    return {dom, resources}
  }

  async function processSnapshotResources({
    snapshot,
    browserName,
    userAgent,
    cookies,
    proxy,
    autProxy,
  }) {
    const [snapshotResources, ...frameResources] = await Promise.all([
      processResources({
        resources: {
          ...(snapshot.resourceUrls || []).reduce((resources, url) => {
            return Object.assign(resources, {[url]: createResource({url, browserName})})
          }, {}),
          ...Object.entries(snapshot.resourceContents || {}).reduce(
            (resources, [url, resource]) => {
              return Object.assign(resources, {[url]: createResource(resource)})
            },
            {},
          ),
        },
        referer: snapshot.url,
        browserName,
        userAgent,
        cookies,
        proxy,
        autProxy,
      }),
      ...(snapshot.frames || []).map(frameSnapshot => {
        return processSnapshotResources({
          snapshot: frameSnapshot,
          browserName,
          userAgent,
          cookies,
          proxy,
          autProxy,
        })
      }),
    ])

    const frameDomResourceMapping = frameResources.reduce((mapping, resources, index) => {
      const frameUrl = snapshot.frames[index].url
      return Object.assign(mapping, {[frameUrl]: resources.mapping[frameUrl]})
    }, {})

    let domResource
    const resourceMappingWithoutDom = {...snapshotResources.mapping, ...frameDomResourceMapping}
    if (snapshot.cdt) {
      domResource = await processResources({
        resources: {
          [snapshot.url]: createDomResource({
            cdt: snapshot.cdt,
            resources: resourceMappingWithoutDom,
          }),
        },
      })
    } else if (snapshot.vhsHash) {
      domResource = await processResources({
        resources: {
          vhs: createVHSResource({
            vhsHash: snapshot.vhsHash,
            resourceMapping: resourceMappingWithoutDom, // this will be empty until resources are supported inside VHS
            vhsType: snapshot.vhsType,
            platformName: snapshot.platformName,
          }),
        },
      })
    } else {
      domResource = await processResources({
        resources: {
          vhs: createVHSResource({
            vhsHash: snapshotResources.mapping.vhs,
            resourceMapping: resourceMappingWithoutDom, // this will be empty until resources are supported inside VHS
            platformName: snapshot.platformName,
          }),
        },
      })
    }

    const frameResourceMapping = frameResources.reduce((mapping, resources) => {
      return Object.assign(mapping, resources.mapping)
    }, {})

    const resourceMapping = {
      ...frameResourceMapping,
      ...snapshotResources.mapping,
      ...domResource.mapping,
    }
    return {
      mapping: resourceMapping,
      promise: Promise.all([
        snapshotResources.promise,
        domResource.promise,
        ...frameResources.map(resources => resources.promise),
      ]).then(() => resourceMapping),
    }
  }
}

module.exports = makeCreateResourceMapping
