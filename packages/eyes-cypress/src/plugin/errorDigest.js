'use strict';
const chalk = require('chalk');

const formatByStatus = {
  Passed: {
    color: 'green',
    symbol: '\u2713'
  },
  Failed: {
    color: 'red',
    symbol: '\u2716'
  },
  Unresolved: {
    color: 'yellow',
    symbol: '\u26A0'
  }
};

function errorDigest({passed, failed, diffs, logger}) {
  logger.log('errorDigest: diff errors', diffs);
  logger.log('errorDigest: test errors', failed);

  const testLink = diffs.length ? `\n\n${indent(2)}See details at: ${diffs[0].getUrl()}` : '';
  return 'Eyes-Cypress detected diffs or errors during execution of visual tests:' + 
  formatTestResults(passed, 'Passed', 'green')
+ formatTestResults(diffs, 'Diffs detected', 'yellow')
+ formatTestResults(failed, 'Errors', 'red')
+ `${testLink}`;
}

function formatTestResults(results, name, color) {
  return results.length ? `\n${indent(2)}${chalk[color](`${name} - ${results.length} tests`)}${testResultsToString(results)}`: ''
}

function stringifyTestResults(testResults) {
  const hostDisplaySize = testResults.getHostDisplaySize();
  const viewport = hostDisplaySize ? `[${hostDisplaySize}]` : '';
  const testName = `${testResults.getName()} ${viewport}`;
  return testName + (testResults.error ? ` : ${testResults.error}` : '');
}

function stringifyError(testResults) {
  return testResults.error ? `${stringifyTestResults(testResults)}` : `[Eyes test not started] : ${testResults}`;
}

function testResultsToString(testResultsArr) {
  const resultString = testResultsArr.reduce((results, testResults) => {
    const error = hasError(testResults) ? stringifyError(testResults) : undefined;
    const formattedSymbol = getColoredSymbol(testResults, error);
    if (formattedSymbol) {      
      results.push(`${formattedSymbol} ${chalk.reset(error || stringifyTestResults(testResults))}`);
    }
    return results;
  }, [])
  return testResultsArr.length ? `\n${indent(3)}${resultString.join(`\n${indent(3)}`)}` : '';
}

function hasError(testResult) {
  return testResult.error || testResult instanceof Error;
}

function getColoredSymbol(testResult, error) {
  if (testResult.isEmpty) {
    return undefined;
  }
  const status = error ? 'Failed' : testResult.getStatus();
  const { color, symbol } = formatByStatus[status];
  return chalk[color](symbol);
}

function indent(count) {
  return `   ${'  '.repeat(count)}`;
}

module.exports = errorDigest;
