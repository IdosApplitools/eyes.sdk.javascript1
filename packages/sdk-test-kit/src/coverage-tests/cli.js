#!/usr/bin/env node
const yargs = require('yargs')
const path = require('path')
const {makeRunTests} = require('./index')
const {sendReport} = require('./send-report')
const {exec} = require('child_process')
const {version} = require('../../package.json')

yargs
  .usage(`Coverage Tests DSL (v${version})`)
  .usage('a.k.a. Da Schwartz Lang - except no substitutes')
  .option('run', {
    alias: 'r',
    describe: 'run coverage tests for a given SDK',
    demandOption: true,
  })
  .option('remote', {
    alias: 'r',
    describe: 'url of where to run the tests',
  })
  .option('path', {
    alias: 'p',
    describe: 'path to implementation file',
    demandOption: true,
  })
  .option('concurrency', {
    alias: 'c',
    describe: 'number of parallel sessions to run at one time',
  })
  .option('nuke', {
    alias: 'n',
    describe: 'kill all ghost browser processes (POSIX only)',
  })
  .option('sendReport', {
    alias: 's',
    describe: 'send a result report to the sandbox QA dashboard',
  })

async function run(args) {
  if (!args) return
  let exitCode = 0
  if (args.run && args.path) {
    const sdkImplementation = require(path.join(path.resolve('.'), args.path))

    console.log(`Running coverage tests for ${sdkImplementation.name}...\n`)

    const {report} = await makeRunTests(
      sdkImplementation.name,
      sdkImplementation.initialize,
    ).runTests(sdkImplementation.supportedTests, {
      host: args.remote,
      concurrency: args.concurrency,
    })

    console.log(`-------------------- SUMMARY --------------------`)
    report.summary.forEach(entry => console.log(entry))
    exitCode = Object.keys(report.errors).length ? 1 : 0

    if (Object.keys(report.errors).length) {
      console.log(`-------------------- ERRORS --------------------`)
      console.log(report.errors)
    }

    if (args.sendReport) {
      console.log('Sending report to QA dashboard...')
      await sendReport(report.toSendReportSchema())
      console.log('Report sent!')
    }
  } else if (args.nuke) {
    exec(`ps ax | grep Chrome | grep headless | awk '{print $1}' | xargs kill -9`)
  }
  console.log(`Exited with code ${exitCode}`)
  process.exit(exitCode)
}

run(yargs.argv)
