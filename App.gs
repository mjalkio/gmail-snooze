function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');

  // Build and return HTML in IFRAME sandbox mode.
  return template.evaluate()
  .setTitle('Gmail Snooze')
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
