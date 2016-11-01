describe('ep_script_elements - update heading type', function(){
  var utils, helperFunctions, padId;
  var action;
  var SECOND_HEADING_POSITION             = 1;
  var THIRD_HEADING_POSITION              = 2;
  var FOURTH_HEADING_POSITION             = 3;
  var ACT_NAME_OF_SECOND_HEADING_LINE     = 10;
  var SECOND_HEADING_LINE                 = 16;
  var SEQUENCE_NAME_OF_THIRD_HEADING_LINE = 18;
  var THIRD_HEADING_LINE                  = 22;
  var FOURTH_HEADING_LINE                 = 27;

  before(function (done) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.updateHeadingType;
    padId = helperFunctions.createNewPadAndFillWithContent(this, done);
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
  utils: null,
  createNewPadAndFillWithContent: function (test, done) {
    var self = this;
    var padId = helper.newPad(function(){
      self.utils = ep_script_elements_test_helper.utils;
      self.createPadContent(done);
    });
    test.timeout(60000);
    return padId;
  },
  createPadContent: function(done){
    var firstSceneText = "SCENE 1";
    var secondSceneText = "SCENE 2";
    var thirdSceneText = "SCENE 3";
    var fourthSceneText = "SCENE 4"
    var lastLineText = "last line";

    var headingWithAct = this.buildHeadingWithAct(firstSceneText);
    var headingWithAct2 = this.buildHeadingWithAct(secondSceneText);
    var headingWithSeq = this.buildHeadingWithSequence(thirdSceneText);
    var heading = this.buildHeadingWithSynopsis(fourthSceneText);
    var action = this.utils.action(lastLineText);
    var firstScene = headingWithAct + this.utils.action("action 1") + this.utils.action("action 1.1") + this.utils.action("action 1.2");
    var secondScene = headingWithAct2 + this.utils.action("action 2");
    var thirdScene = headingWithSeq + this.utils.action("action 3") + this.utils.action("action 3.1");
    var fourthScene = heading + action;

    var script = firstScene + secondScene + thirdScene + fourthScene;
    this.utils.createScriptWith(script, lastLineText, done);
  },
  buildHeadingWithAct: function(text) {
    return this.utils.act(text) + this.buildHeadingWithSequence(text);
  },
  buildHeadingWithSequence: function(text) {
    return this.utils.sequence(text) + this.buildHeadingWithSynopsis(text);
  },
  buildHeadingWithSynopsis: function(text) {
    return this.utils.synopsis(text) + this.utils.heading(text);
  },
  addSceneMarkToLine: function(line, sceneMarkToAddToLine, done){
    var outer$ = helper.padOuter$;
    var mouseShortcutsUtils =  ep_mouse_shortcuts_test_helper.utils;

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
    this.utils.validateLineTextAndType(0  , 'SCENE 1'    , 'act_name');
    this.utils.validateLineTextAndType(1  , 'SCENE 1'    , 'act_summary');
    this.utils.validateLineTextAndType(2  , 'SCENE 1'    , 'sequence_name');
    this.utils.validateLineTextAndType(3  , 'SCENE 1'    , 'sequence_summary');
    this.utils.validateLineTextAndType(4  , 'SCENE 1'    , 'scene_name');
    this.utils.validateLineTextAndType(5  , 'SCENE 1'    , 'scene_summary');
    this.utils.validateLineTextAndType(6  , 'SCENE 1'    , 'heading');
    this.utils.validateLineTextAndType(7  , 'action 1'   , 'action');
    this.utils.validateLineTextAndType(8  , 'action 1.1' , 'action');
    this.utils.validateLineTextAndType(9  , 'action 1.2' , 'action');
    this.utils.validateLineTextAndType(10 , 'SCENE 2'    , 'act_name');
    this.utils.validateLineTextAndType(11 , 'SCENE 2'    , 'act_summary');
    this.utils.validateLineTextAndType(12 , 'SCENE 2'    , 'sequence_name');
    this.utils.validateLineTextAndType(13 , 'SCENE 2'    , 'sequence_summary');
    this.utils.validateLineTextAndType(14 , 'SCENE 2'    , 'scene_name');
    this.utils.validateLineTextAndType(15 , 'SCENE 2'    , 'scene_summary');
    this.utils.validateLineTextAndType(16 , 'SCENE 2'    , 'heading');
    this.utils.validateLineTextAndType(17 , 'action 2'   , 'action');
    this.utils.validateLineTextAndType(18 , 'SCENE 3'    , 'sequence_name');
    this.utils.validateLineTextAndType(19 , 'SCENE 3'    , 'sequence_summary');
    this.utils.validateLineTextAndType(20 , 'SCENE 3'    , 'scene_name');
    this.utils.validateLineTextAndType(21 , 'SCENE 3'    , 'scene_summary');
    this.utils.validateLineTextAndType(22 , 'SCENE 3'    , 'heading');
    this.utils.validateLineTextAndType(23 , 'action 3'   , 'action');
    this.utils.validateLineTextAndType(24 , 'action 3.1' , 'action');
    this.utils.validateLineTextAndType(25 , 'SCENE 4'    , 'scene_name');
    this.utils.validateLineTextAndType(26 , 'SCENE 4'    , 'scene_summary');
    this.utils.validateLineTextAndType(27 , 'SCENE 4'    , 'heading');
    this.utils.validateLineTextAndType(28 , 'last line'  , 'action');
  }
}