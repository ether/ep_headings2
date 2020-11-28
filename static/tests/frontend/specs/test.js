'use strict';

describe('ep_headings2 - Set Heading and ensure its removed properly', function () {
  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });

  // Create Pad
  // Check Default Text has no Heading
  // Set Line 1 heading and check it's set
  // Set Line 2 to null heading value and check it's set

  it('Option select is changed when heading is changed', async function () {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const inner$ = helper.padInner$;

    const $firstTextElement = inner$('div').first();

    const $editorContents = inner$('div');
    $editorContents.sendkeys('{selectall}');
    $firstTextElement.sendkeys('First Line!');

    // sets first line to h1
    chrome$('#heading-selection').val('0');
    chrome$('#heading-selection').change();

    $firstTextElement.sendkeys('{enter}');

    await helper.waitForPromise(() => chrome$('#heading-selection').val() === '0');
    inner$('div').first().sendkeys('{selectall}');
    const $secondElement = inner$('div').first().next();
    $secondElement.sendkeys('Second Line');
    $secondElement.sendkeys('{selectall}');
    await helper.waitForPromise(() => chrome$('#heading-selection').val() === '-1');
    expect($secondElement.find('h1').length).to.be(0);
    expect($secondElement.text()).to.be('Second Line');
  });
});
