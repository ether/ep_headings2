describe('ep_script_elements - update heading type', function(){
  var utils, helperFunctions, padId;
  var action;
  var SECOND_HEADING_POSITION             = 1;
  var THIRD_HEADING_POSITION              = 2;
  var FOURTH_HEADING_POSITION             = 3;
  var ACT_NAME_OF_SECOND_HEADING_LINE     = 8;
  var SECOND_HEADING_LINE                 = 13;
  var SEQUENCE_NAME_OF_THIRD_HEADING_LINE = 14;
  var THIRD_HEADING_LINE                  = 16;
  var FOURTH_HEADING_LINE                 = 19;

  before(function (done) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.updateHeadingType;
    padId = helper.newPad(function(){
      helperFunctions.createScript(done);
    });
    this.timeout(60000);
  });

  context('when user loads the script', function(){

    beforeEach(function(cb) {
      this.timeout(5000);

      setTimeout(function() {
        helper.newPad(cb, padId);
      }, 1000);
    });

    it('adds the class "sceneWithSequence" in the heading with only sequences', function(done){
      helperFunctions.addClassOnHeading(THIRD_HEADING_POSITION);
      done();
    });
  });

  context('integration with ep_mouse_shortcuts', function(){
    context('when user adds a sequence in a heading', function(){
      before(function (done) {
        action = '#addSequence';
        helperFunctions.addSceneMarkToLine(FOURTH_HEADING_LINE, action,  done);
      });

      it('adds the class "sceneWithSequence" in the heading', function(done){
        helperFunctions.addClassOnHeading(FOURTH_HEADING_POSITION);
        done();
      });

      context('when user presses undo', function(){
        before(function () {
          utils.undo();
        });

        it('returns to the original text', function(done){
          helperFunctions.keepsTheSameText();
          done();
        });

        it('removes the class "sceneWithSequence" added', function(done){
          helperFunctions.removesClassOnHeading(FOURTH_HEADING_POSITION);
          done();
        });
      });
    });

    context('when user adds an act in a heading with sequence', function(){
      before(function (done) {
        action = '#addAct';
        helperFunctions.addSceneMarkToLine(THIRD_HEADING_LINE, action,  done);
      });

      it('removes the class "sceneWithSequence" from heading', function(done){
        helperFunctions.removesClassOnHeading(THIRD_HEADING_POSITION);
        done();
      });

      context('when user presses undo', function(){
        before(function () {
          utils.undo();
        });

        it('returns to the original text', function(done){
          helperFunctions.keepsTheSameText();
          done();
        });

        it('returns the class "sceneWithSequence" on the heading with sequence', function(done){
          helperFunctions.addClassOnHeading(THIRD_HEADING_POSITION);
          done();
        });
      });
    });
  });

  context('integration with ep_script_scene_marks', function(){
    context('when user removes an act from heading', function(){
      before(function () {
        var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

        // make the scene mark visible
        sceneMarkUtils.clickOnSceneMarkButtonOfLine(SECOND_HEADING_LINE);

        // click on the act trash icon
        sceneMarkUtils.clickTrashIcon(ACT_NAME_OF_SECOND_HEADING_LINE);
      });

      it('adds the class "sceneWithSequence" on the heading', function(done){
        helperFunctions.addClassOnHeading(SECOND_HEADING_POSITION);
        done();
      });

      context('when user presses undo', function(){
        before(function () {
          utils.undo();
        });

        it('returns to the original text', function(done){
          helperFunctions.keepsTheSameText();
          done();
        });

        it('removes the class "sceneWithSequence" added', function(done){
          helperFunctions.removesClassOnHeading(SECOND_HEADING_POSITION);
          done();
        });
      });
    });

    context('when user removes a sequence from a heading', function(){
      before(function () {
        var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

        // make the scene mark visible
        sceneMarkUtils.clickOnSceneMarkButtonOfLine(THIRD_HEADING_LINE);

        // click on the sequence trash icon
        sceneMarkUtils.clickTrashIcon(SEQUENCE_NAME_OF_THIRD_HEADING_LINE);
      });

      it('removes the class "sceneWithSequence" added', function(done){
        // as the sequence was removed the heading is 2 lines above
        // var thirdHeadingNewLine = THIRD_HEADING_LINE - 2;
        helperFunctions.removesClassOnHeading(THIRD_HEADING_POSITION);
        done();
      });

      context('when user presses undo', function(){
        before(function () {
          utils.undo();
        });

        it('returns to the original text', function(done){
          helperFunctions.keepsTheSameText();
          done();
        });

        it('returns the class "sceneWithSequence" on the heading with sequence', function(done){
          helperFunctions.addClassOnHeading(THIRD_HEADING_POSITION);
          done();
        });
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.updateHeadingType = {
  SEQUENCE_CLASS: '.sceneWithSequence',
  createScript: function(done){
    var SMUtils = ep_script_scene_marks_test_helper.utils;
    var utils = ep_script_elements_test_helper.utils;
    var firstSceneText = "SCENE 1";
    var secondSceneText = "SCENE 2";
    var thirdSceneText = "SCENE 3";
    var fourthSceneText = "SCENE 4"
    var lastLineText = "last line";

    var headingWithAct = SMUtils.act(firstSceneText) + SMUtils.sequence(firstSceneText) + SMUtils.heading(firstSceneText);
    var headingWithAct2 = SMUtils.act(secondSceneText) + SMUtils.sequence(secondSceneText) + SMUtils.heading(secondSceneText);
    var headingWithSeq = SMUtils.sequence(thirdSceneText) + SMUtils.heading(thirdSceneText);
    var heading = SMUtils.heading(fourthSceneText);
    var action = utils.action(lastLineText);
    var firstScene = headingWithAct + utils.action("action 1") + utils.action("action 1.1") + utils.action("action 1.2");
    var secondScene = headingWithAct2 + utils.action("action 2");
    var thirdScene = headingWithSeq + utils.action("action 3") + utils.action("action 3.1");
    var fourthScene = heading + action;

    var script = firstScene + secondScene + thirdScene + fourthScene;
    utils.createScriptWith(script, lastLineText, done);
  },
  addSceneMarkToLine: function(line, sceneMarkToAddToLine, done){
    var outer$ = helper.padOuter$;
    var mouseShortcutsUtils =  ep_mouse_shortcuts_test_helper.sceneMarksItemsVisibility;

    mouseShortcutsUtils.rightClickOnLine(line, function(){
      var $mouseWindow = outer$('.mouseWindow');

      // clicks in the button add act or sequence
      $mouseWindow.find(sceneMarkToAddToLine).click();
      done();
    });
  },
  // headingPostion is 1st(0), 2nd(1), 3rd(2) and so on
  addClassOnHeading: function(headingPosition){
    var inner$ = helper.padInner$;
    var $headingWithSeq = inner$('div:has(heading)').slice(headingPosition, headingPosition + 1);
    var headingHasClassSeq = $headingWithSeq.find(this.SEQUENCE_CLASS).length === 1;
    expect(headingHasClassSeq).to.be(true);
  },
  // headingPostion is 1st(0), 2nd(1), 3rd(2) and so on
  removesClassOnHeading: function(headingPosition){
    var inner$ = helper.padInner$;
    var $heading = inner$('div:has(heading)').slice(headingPosition, headingPosition + 1);
    var headingHasClassSeq = $heading.find(this.SEQUENCE_CLASS).length === 1;

    expect($heading.length).to.be(1);
    expect(headingHasClassSeq).to.be(false);
  },
  keepsTheSameText: function(){
    var utils = ep_script_elements_test_helper.utils;

    utils.validateLineTextAndType(0  , 'ACT OF SCENE 1'                 , 'act_name');
    utils.validateLineTextAndType(1  , 'SUMMARY OF ACT OF SCENE 1'      , 'act_summary');
    utils.validateLineTextAndType(2  , 'SEQUENCE OF SCENE 1'            , 'sequence_name');
    utils.validateLineTextAndType(3  , 'SUMMARY OF SEQUENCE OF SCENE 1' , 'sequence_summary');
    utils.validateLineTextAndType(4  , 'SCENE 1'                        , 'heading');
    utils.validateLineTextAndType(5  , 'action 1'                       , 'action');
    utils.validateLineTextAndType(6  , 'action 1.1'                     , 'action');
    utils.validateLineTextAndType(7  , 'action 1.2'                     , 'action');
    utils.validateLineTextAndType(8  , 'ACT OF SCENE 2'                 , 'act_name');
    utils.validateLineTextAndType(9  , 'SUMMARY OF ACT OF SCENE 2'      , 'act_summary');
    utils.validateLineTextAndType(10 , 'SEQUENCE OF SCENE 2'            , 'sequence_name');
    utils.validateLineTextAndType(11 , 'SUMMARY OF SEQUENCE OF SCENE 2' , 'sequence_summary');
    utils.validateLineTextAndType(12 , 'SCENE 2'                        , 'heading');
    utils.validateLineTextAndType(13 , 'action 2'                       , 'action');
    utils.validateLineTextAndType(14 , 'SEQUENCE OF SCENE 3'            , 'sequence_name');
    utils.validateLineTextAndType(15 , 'SUMMARY OF SEQUENCE OF SCENE 3' , 'sequence_summary');
    utils.validateLineTextAndType(16 , 'SCENE 3'                        , 'heading');
    utils.validateLineTextAndType(17 , 'action 3'                       , 'action');
    utils.validateLineTextAndType(18 , 'action 3.1'                     , 'action');
    utils.validateLineTextAndType(19 , 'SCENE 4'                        , 'heading');
    utils.validateLineTextAndType(20 , 'last line'                      , 'action');
  }
}