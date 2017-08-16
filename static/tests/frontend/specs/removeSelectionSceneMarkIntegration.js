describe('ep_script_elements - remove selection - ep_script_scene_marks integration', function() {
  var utils, helperFunctions, sceneMarkUtils;

  before(function(done) {
    sceneMarkUtils = ep_script_scene_marks_test_helper.utils;
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.removeSelectionSceneMarkIntegration;
    helperFunctions.createScriptWithSEandSM(done);
    this.timeout(60000);
  });

  var testItGoesBackToOriginalTextWheItPressesUndo = function() {
    context("and user performs undo", function(){
      before(function(done){
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
  }

  context('when selection begins in a script element and goes until a scene mark', function(){
    before(function(done) {
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
      utils.pressKey(BACKSPACE);
      done();
      this.timeout(60000);
    });

    it('removes the scrips elements selected and cleans the scene marks selected', function(done){
      utils.validateLineTextAndType(9, 'sh', 'shot');
      utils.validateLineTextAndType(10, '', 'act_name');
      utils.validateLineTextAndType(11, '', 'act_summary');
      utils.validateLineTextAndType(12, '', 'sequence_name');
      utils.validateLineTextAndType(13, '', 'sequence_summary');
      done();
    });

    testItGoesBackToOriginalTextWheItPressesUndo();
  });

  context('when selection begins in a script element and goes until a heading with scene mark', function(){
    before(function(done) {
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
      utils.pressKey(BACKSPACE);
      done();
      this.timeout(60000);
    });

    it('removes part of heading, clean the scene marks and removes all rest until the selection start', function(done){
      utils.validateLineTextAndType(9, 'sh', 'shot');
      utils.validateLineTextAndType(10, '', 'act_name');
      utils.validateLineTextAndType(11, '', 'act_summary');
      utils.validateLineTextAndType(12, '', 'sequence_name');
      utils.validateLineTextAndType(13, '', 'sequence_summary');
      utils.validateLineTextAndType(14, '', 'scene_name');
      utils.validateLineTextAndType(15, '', 'scene_summary');
      utils.validateLineTextAndType(16, 'd scene', 'heading');
      done();
    });

    testItGoesBackToOriginalTextWheItPressesUndo();
  });

  context('when selection begins in a beginning of a heading with scene marks', function(){
    context('and the heading with scene marks is the first lines of pad', function(){
      before(function(done){
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

      testItGoesBackToOriginalTextWheItPressesUndo();
    });

    // simulates triple click in a heading with scene mark
    context('and the heading with scene marks is not on top of pad', function(){
      before(function(done){
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
        utils.validateLineTextAndType(9, 'shot', 'shot');
        utils.validateLineTextAndType(10, 'action', 'action');
        done();
      });

      testItGoesBackToOriginalTextWheItPressesUndo();
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.removeSelectionSceneMarkIntegration = {
  createScriptWithSEandSM: function(cb){
    var utils = ep_script_elements_test_helper.utils;
    helper.newPad(function() {
      var firstSceneText = 'first scene';
      var lastLineOfText = 'action';
      var secondSceneText = 'second scene';

      var firstScene  = utils.act(firstSceneText) + utils.actSummary(firstSceneText) +
                        utils.sequence(firstSceneText) + utils.sequenceSummary('1.1 seq sum') +
                        utils.synopsis(firstSceneText) + utils.heading(firstSceneText);
      var shot        = utils.shot('shot');
      var secondScene = utils.act(secondSceneText) + utils.actSummary(secondSceneText) +
                        utils.sequence(secondSceneText) + utils.sequenceSummary('2.1 seq sum') +
                        utils.synopsis(secondSceneText) + utils.heading(secondSceneText);
      var action      = utils.action(lastLineOfText);

      var script      = firstScene + shot + secondScene + action;


      utils.createScriptWith(script, lastLineOfText, cb);
    });
  },
  checkIfItHasTheOriginalText: function(cb){
    var utils = ep_script_elements_test_helper.utils;

    utils.validateLineTextAndType(0  , 'first scene'  , 'act_name');
    utils.validateLineTextAndType(1  , 'first scene'  , 'act_summary');
    utils.validateLineTextAndType(2  , 'first scene'  , 'act_summary');
    utils.validateLineTextAndType(3  , 'first scene'  , 'sequence_name');
    utils.validateLineTextAndType(4  , 'first scene'  , 'sequence_summary');
    utils.validateLineTextAndType(5  , '1.1 seq sum'  , 'sequence_summary');
    utils.validateLineTextAndType(6  , 'first scene'  , 'scene_name');
    utils.validateLineTextAndType(7  , 'first scene'  , 'scene_summary');
    utils.validateLineTextAndType(8  , 'first scene'  , 'heading');
    utils.validateLineTextAndType(9  , 'shot'         , 'shot');
    utils.validateLineTextAndType(10 , 'second scene' , 'act_name');
    utils.validateLineTextAndType(11 , 'second scene' , 'act_summary');
    utils.validateLineTextAndType(12 , 'second scene' , 'act_summary');
    utils.validateLineTextAndType(13 , 'second scene' , 'sequence_name');
    utils.validateLineTextAndType(14 , 'second scene' , 'sequence_summary');
    utils.validateLineTextAndType(15 , '2.1 seq sum'  , 'sequence_summary');
    utils.validateLineTextAndType(16 , 'second scene' , 'scene_name');
    utils.validateLineTextAndType(17 , 'second scene' , 'scene_summary');
    utils.validateLineTextAndType(18 , 'second scene' , 'heading');
    utils.validateLineTextAndType(19 , 'action'       , 'action');
    cb();
  }
}