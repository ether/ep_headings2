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

  it('Heading select has aria-label for accessibility', async function () {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const $select = chrome$('#heading-selection');
    expect($select.attr('aria-label')).to.not.be(undefined);
    expect($select.attr('aria-label').length).to.be.greaterThan(0);
  });

  it('Focus returns to editor after selecting a heading', async function () {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const inner$ = helper.padInner$;

    // Type some text
    const $firstTextElement = inner$('div').first();
    $firstTextElement.sendkeys('{selectall}');
    $firstTextElement.sendkeys('Test focus');

    // Select heading 1
    chrome$('#heading-selection').val('0');
    chrome$('#heading-selection').change();

    // Wait for heading to be applied, then check focus is back in the editor
    await helper.waitForPromise(() => inner$('div').first().find('h1').length === 1);

    // The editor iframe should have focus, not the toolbar
    const editorHasFocus = inner$('div').first().is(':focus') ||
        inner$.document.hasFocus() ||
        $(helper.padOuter$.document).find('iframe[name="ace_inner"]').is(':focus');
    expect(editorHasFocus).to.be(true);
  });

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
