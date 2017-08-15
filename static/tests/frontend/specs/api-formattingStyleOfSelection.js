describe('ep_script_elements - API - formatting button handle', function () {
  var helperFunctions;
  var FIRST_LINE = 0;
  before(function (done) {
    helperFunctions = ep_script_elements_test_helper.formattingButtonHandle;
    apiUtils = ep_script_elements_test_helper.apiUtils;
    helper.newPad(function(){
      apiUtils.startListeningToApiEvents();
      helperFunctions.createPadWithSE(done);
    });
    this.timeout(10000);
  });

  context('when API receives a message that formatting button was pressed', function() {
    ['bold', 'italic', 'underline'].forEach(function(buttonName){
      context('and button pressed is ' + buttonName, function() {
        before(function (done) {
          var $firstElement = helper.padInner$('div').eq(0);
          helper.selectLines($firstElement, $firstElement, 0, 4);
          apiUtils.simulateTriggerOfFormattingButtonChanged(buttonName);
          done();
        });

        it('applies ' + buttonName + ' on the selection', function (done) {
          helperFunctions.testIfFormattingTagIsAppliedOnLine(FIRST_LINE, buttonName, true, done);
        });

        context('and presses the button '+ buttonName + ' again', function() {
          before(function (done) {
            apiUtils.simulateTriggerOfFormattingButtonChanged(buttonName);
            done();
          });

          it('removes the ' + buttonName + ' from the selection', function (done) {
            helperFunctions.testIfFormattingTagIsAppliedOnLine(FIRST_LINE, buttonName, false, done);
          });
        })
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.formattingButtonHandle = {
  FORMATTING_TAG: {
    bold: 'b',
    italic: 'i',
    underline: 'u',
  },
  createPadWithSE: function(done) {
    var utils = ep_script_elements_test_helper.utils;
    var lastLineText = 'action';
    var general = utils.general('general');
    var action = utils.action(lastLineText)

    var script = general + action;
    utils.createScriptWith(script, lastLineText, done);
  },
  testIfFormattingTagIsAppliedOnLine: function(lineNumber, style, shouldHaveTagApplied, done) {
    var lineHasFormattingApplied = this.hasFormattingApplied(lineNumber, style);
    expect(lineHasFormattingApplied).to.be(shouldHaveTagApplied);
    done();
  },
  hasFormattingApplied: function(lineNumber, style) {
    var $lineTarget = helper.padInner$('div').eq(lineNumber);
    var formattingIsApplied = $lineTarget.find(this.FORMATTING_TAG[style]).length === 1;
    return formattingIsApplied;
  },
}
