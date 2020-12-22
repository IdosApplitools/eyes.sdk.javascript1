const fs = require('fs')
const path = require('path')

async function createTestFiles(tests, {output, outPath, ext, formatter}) {
  const targetDirectory = path.join(process.cwd(), output || outPath)

  fs.rmdirSync(targetDirectory, {recursive: true})
  fs.mkdirSync(targetDirectory, {recursive: true})

  tests.forEach(async test => {
    const filePath = path.resolve(targetDirectory, `${test.key}${ext}`)
    fs.writeFileSync(filePath, formatter ? await formatter(test.code) : test.code)
  })
}

async function createTestMetaData(tests, {metaPath = '', pascalizeTests = true} = {}) {
  const targetDirectory = path.resolve(process.cwd(), metaPath)
  fs.mkdirSync(targetDirectory, {recursive: true})

  const meta = tests.reduce((meta, test) => {
    const data = {isGeneric: true, name: test.group}
    if (test.config) {
      if (test.config.stitchMode) data.executionMode = test.config.stitchMode.toLowerCase()
      else if (test.vg) data.executionMode = 'visualgrid'
    }
    meta[pascalizeTests ? test.key : test.name] = data
    return meta
  }, {})

  const filePath = path.resolve(targetDirectory, 'coverage-tests-metadata.json')
  fs.writeFileSync(filePath, JSON.stringify(meta, null, '\t'))
}

exports.createTestFiles = createTestFiles
exports.createTestMetaData = createTestMetaData
