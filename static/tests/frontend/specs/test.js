describe('Set Heading and ensure its removed properly', function () {
  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });

  // Create Pad
  // Check Default Text has no Heading
  // Set Line 1 heading and check it's set
  // Set Line 2 to null heading value and check it's set

  it('Option select is changed when heading is changed', function (done) {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const inner$ = helper.padInner$;

    const $firstTextElement = inner$('div').first();
    const $editorContainer = chrome$('#editorcontainer');

    const $editorContents = inner$('div');
    $editorContents.sendkeys('{selectall}');
    $firstTextElement.sendkeys('First Line!');

    // sets first line to h1
    chrome$('#heading-selection').val('0');
    chrome$('#heading-selection').change();

    $firstTextElement.sendkeys('{enter}');

    const $h1Element = inner$('div').first();

    helper.waitFor(() => chrome$('#heading-selection').val() == 0).done(() => {
      const $firstTextElement = inner$('div').first();
      $firstTextElement.sendkeys('{selectall}');
      const $secondElement = inner$('div').first().next();
      $secondElement.sendkeys('Second Line');
      $secondElement.sendkeys('{selectall}');
      helper.waitFor(() => chrome$('#heading-selection').val() == -1).done(() => {
        expect($secondElement.find('h1').length).to.be(0);
        expect($secondElement.text()).to.be('Second Line');
        done();
      });
    });
  });
});
