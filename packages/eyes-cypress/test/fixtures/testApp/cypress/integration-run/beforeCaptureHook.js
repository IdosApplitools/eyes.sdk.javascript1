/* global cy */
describe('works with beforeCaptureHook', () => {
  it('test beforeCaptureHook', () => {
    cy.visit('https://applitools.com/helloworld');
    cy.eyesOpen({
      appName: 'some app',
      testName: 'test beforeCaptureHook',
      browser: {width: 1200, height: 800},
    });

    cy.eyesCheckWindow({
      target: 'window',
      scriptHooks: {
        beforeCaptureScreenshot: "document.body.style.backgroundColor = 'gold'",
      },
    });

    cy.eyesClose();
  });
});
