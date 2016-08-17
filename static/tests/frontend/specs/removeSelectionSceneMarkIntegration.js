describe('ep_script_elements - remove selection - ep_script_scene_marks integration', function() {
  var utils, helperFunctions;

  before(function() {
    sceneMarkUtils = ep_script_scene_marks_test_helper.utils;
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.removeSelectionSceneMarkIntegration;
  });

  beforeEach(function(done){
    helperFunctions.createScriptWithSEandSM(done);
    this.timeout(60000);
  });

  context('when selection begins in a script element and goes until a scene mark', function(){
    beforeEach(function(done) {
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 1);
      sceneMarkUtils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;
      var $firstElement = inner$('div:has(shot)').last();
      var $lastElement = inner$('div:has(sequence_summary)').last();
      var offsetAtFirstElement = 2;
      var offsetLastLineSelection = 0;
      var lastLineLength = $lastElement.text().length;
      var offsetAtlastElement = lastLineLength - offsetLastLineSelection;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // remove the selection
      sceneMarkUtils.pressKey(BACKSPACE);
      done();
      this.timeout(60000);
    });

    it('removes the scrips elements selected and cleans the scene marks selected', function(done){
      utils.validateLineTextAndType(7, 'sh', 'shot');
      utils.validateLineTextAndType(8, '', 'act_name');
      utils.validateLineTextAndType(9, '', 'act_summary');
      utils.validateLineTextAndType(10, '', 'sequence_name');
      utils.validateLineTextAndType(11, '', 'sequence_summary');
      done();
    });

    context("and user performs undo", function(){
      beforeEach(function(done){
        // we have to wait a little to save the changes
        setTimeout(function() {
          utils.undo();
          done();
        }, 1000);
      });

      it("keeps the original text and types", function(done){
        helperFunctions.checkIfItHasTheOriginalText(done);
      });
    });
  });

  context('when selection begins in a script element and goes until a heading with scene mark', function(){
    beforeEach(function(done) {
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 1);
      sceneMarkUtils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(shot)').first();
      var $lastElement = inner$('div:has(heading)').last();

      var lastLineLength = $lastElement.text().length;
      var offsetAtFirstElement = 2;
      var offsetLastLineSelection = 7;
      var offsetAtlastElement = lastLineLength - offsetLastLineSelection;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // remove the selection
      sceneMarkUtils.pressKey(BACKSPACE);
      done();
      this.timeout(60000);
    });

    it('removes part of heading, clean the scene marks and removes all rest until the selection start', function(done){
      utils.validateLineTextAndType(7, 'sh', 'shot');
      utils.validateLineTextAndType(8, '', 'act_name');
      utils.validateLineTextAndType(9, '', 'act_summary');
      utils.validateLineTextAndType(10, '', 'sequence_name');
      utils.validateLineTextAndType(11, '', 'sequence_summary');
      utils.validateLineTextAndType(12, 'heading', 'heading');
      done();
    });

    context("and user performs undo", function(){
      beforeEach(function(done){
        // we have to wait a little to save the changes
        setTimeout(function() {
          utils.undo();
          done();
        }, 1000);
      });

      it("keeps the original text and types", function(done){
        helperFunctions.checkIfItHasTheOriginalText(done);
      });
    });
  });

  context('when selection begins in a beginning of a heading with scene marks', function(){
    context('and the heading with scene marks is the first lines of pad', function(){
      beforeEach(function(done){
        var inner$ = helper.padInner$;
        var $firstElement = inner$('div:has(heading)').first();
        var $lastElement = $firstElement.nextUntil('div:has(action)').next();
        var offsetAtFirstElement = 0;
        var offsetLastLineSelection = 2;
        var lastLineLength = $lastElement.text().length;
        var offsetAtlastElement = lastLineLength - offsetLastLineSelection;

        // make the selection
        helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

        // remove the text
        utils.pressKey(BACKSPACE);
        done();
        this.timeout(60000);
      });

      it('removes the scene marks of this heading and removes the rest selected', function(done){
        utils.validateLineTextAndType(0, 'on', 'action');
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    });

    // simulates triple click in a heading with scene mark
    context('and the heading with scene marks is not on top of pad', function(){
      beforeEach(function(done){
        var inner$ = helper.padInner$;
        var $firstElement = inner$('div:has(heading)').last();
        var $lastElement = $firstElement.next();
        var offsetAtFirstElement = 0;
        var offsetAtlastElement = 0;

        // make the selection
        helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

        // remove the text
        utils.pressKey(BACKSPACE);
        done();
        this.timeout(60000);
      });

      it('removes the scene marks of this heading and removes the rest selected', function(done){
        utils.validateLineTextAndType(7, 'shot', 'shot');
        utils.validateLineTextAndType(8, 'action', 'action');
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.removeSelectionSceneMarkIntegration = {
  createScriptWithSEandSM: function(cb){
    var utils = ep_script_scene_marks_test_helper.utils;
    helper.newPad(function() {
      var firstHeadingText = 'First heading';
      var lastLineOfText = 'action';
      var secondHeadingText = 'Second heading';

      var firstHeading  = utils.act(firstHeadingText) + utils.actSummary(firstHeadingText) +
                          utils.sequence(firstHeadingText) + utils.sequenceSummary('1.1 seq sum') +
                          utils.heading(firstHeadingText);
      var shot          = utils.shot('shot');
      var secondHeading = utils.act(secondHeadingText) + utils.actSummary(secondHeadingText) +
                          utils.sequence(secondHeadingText) + utils.sequenceSummary('2.1 seq sum') +
                          utils.heading(secondHeadingText);
      var action        = utils.action(lastLineOfText);

      var script        = firstHeading + shot + secondHeading + action;


      utils.createScriptWith(script, lastLineOfText, cb);
    });
  },
  checkIfItHasTheOriginalText: function(cb){
    var utils = ep_script_scene_marks_test_helper.utils;
    utils.validateLineTextAndType(0, 'ACT OF First heading', 'act_name');
    utils.validateLineTextAndType(1, 'SUMMARY OF ACT OF First heading', 'act_summary');
    utils.validateLineTextAndType(2, 'First heading', 'act_summary');
    utils.validateLineTextAndType(3, 'SEQUENCE OF First heading', 'sequence_name');
    utils.validateLineTextAndType(4, 'SUMMARY OF SEQUENCE OF First heading', 'sequence_summary');
    utils.validateLineTextAndType(5, '1.1 seq sum', 'sequence_summary');
    utils.validateLineTextAndType(6, 'First heading', 'heading');
    utils.validateLineTextAndType(7, 'shot', 'shot');
    utils.validateLineTextAndType(8, 'ACT OF Second heading', 'act_name');
    utils.validateLineTextAndType(9, 'SUMMARY OF ACT OF Second heading', 'act_summary');
    utils.validateLineTextAndType(10, 'Second heading', 'act_summary');
    utils.validateLineTextAndType(11, 'SEQUENCE OF Second heading', 'sequence_name');
    utils.validateLineTextAndType(12, 'SUMMARY OF SEQUENCE OF Second heading', 'sequence_summary');
    utils.validateLineTextAndType(13, '2.1 seq sum', 'sequence_summary');
    utils.validateLineTextAndType(14, 'Second heading', 'heading');
    utils.validateLineTextAndType(15, 'action', 'action');
    cb();
  }
}