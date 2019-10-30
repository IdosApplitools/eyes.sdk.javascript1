'use strict';
const {presult} = require('@applitools/functional-commons');
const makeWaitForTestEnd = require('./makeWaitForTestEnd');
const storeBatchHandle = require('./storeBatchHandle');

function makeClose({
  getCheckWindowPromises,
  wrappers,
  openEyesPromises,
  resolveTests,
  testController,
  logger,
  batches,
  isIsngleWindow,
}) {
  const waitAndResolveTests = makeWaitForTestEnd({
    getCheckWindowPromises,
    openEyesPromises,
  });

  return async (throwEx = true) => {
    let error, didError;
    const settleError = (throwEx ? Promise.reject : Promise.resolve).bind(Promise);

    if (testController.getIsAbortedByUser()) {
      logger.log('closeEyes() aborted by user');
      return settleError([]);
    }

    return waitAndResolveTests(async (testIndex, checkWindowResult) => {
      resolveTests[testIndex]();

      if ((error = testController.getFatalError())) {
        logger.log('closeEyes() fatal error found');
        !isIsngleWindow && (await wrappers[testIndex].ensureAborted());
        return (didError = true), error;
      }
      if ((error = testController.getError(testIndex))) {
        logger.log('closeEyes() found test error');
        return (didError = true), error;
      }

      const closePromise = !isIsngleWindow
        ? wrappers[testIndex].close(throwEx)
        : wrappers[testIndex].closeTestWindow(checkWindowResult, throwEx);
      const [closeError, closeResult] = await presult(closePromise);
      if (!closeError) {
        setRenderIds(closeResult, testIndex);
        return closeResult;
      } else {
        didError = true;
        return closeError;
      }
    }).then(results => {
      storeBatchHandle(wrappers, batches);
      return didError ? settleError(results) : results;
    });
  };

  function setRenderIds(result, testIndex) {
    const renderIds = testController.getRenderIds(testIndex);
    const steps = result.getStepsInfo();
    for (const [i, renderId] of renderIds.entries()) {
      steps[i].setRenderId(renderId);
    }
  }
}

module.exports = makeClose;
