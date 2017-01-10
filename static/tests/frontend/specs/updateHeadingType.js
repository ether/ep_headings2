describe('ep_script_elements - update heading type', function(){
  var utils, helperFunctions, padId;
  var action;
  var ACT_NAME_OF_FIRST_HEADING_LINE      = 0;
  var FIRST_HEADING_POSITION              = 0;
  var SECOND_HEADING_POSITION             = 1;
  var THIRD_HEADING_POSITION              = 2;
  var FOURTH_HEADING_POSITION             = 3;
  var FIRST_HEADING_LINE                  = 6;
  var FIRST_ACTION_LINE                   = 7;
  var SEQUENCE_NAME_OF_THIRD_HEADING_LINE = 18;
  var THIRD_HEADING_LINE                  = 22;
  var FOURTH_HEADING_LINE                 = 27;
  var HEADING_TYPE_CLASS = {
    act: 'headingWithAct',
    seq: 'headingWithSequence',
    syn: 'headingWithSynopsis',
  };

  before(function (done) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.updateHeadingType;
    padId = helperFunctions.createNewPadAndFillWithContent(this, done);
  });

  var undoKeepTheSameTextAndRemoveTheClassOnHeading = function(headingPosition, headingType) {
    context('when user presses undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.keepsTheSameText();
        done();
      });

      it('removes the class ' + HEADING_TYPE_CLASS[headingType] + ' added', function(done){
        helperFunctions.removeClassOnHeading(headingPosition, headingType);
        done();
      });
    });
  }

  var undoKeepTheSameTextAndKeepTheClassOnHeading = function(headingPosition, headingType) {
    context('when user presses undo', function(){
      before(function () {
        utils.undo();
      });

      it('goes back to the original text', function(done){
        helperFunctions.keepsTheSameText();
        done();
      });

      it('has the class ' + HEADING_TYPE_CLASS[headingType] + ' on the heading', function(done){
        helperFunctions.addClassOnHeading(headingPosition, headingType);
        done();
      });
    });
  }

  context('when user loads the script', function(){

    before(function(cb) {
      this.timeout(5000);

      setTimeout(function() {
        helper.newPad(cb, padId);
      }, 1000);
    });

    it('adds the class "headingWithSynopsis" in the heading with only synopsis', function(done){
      helperFunctions.addClassOnHeading(FOURTH_HEADING_POSITION, 'syn');
      done();
    });

    it('adds the class "headingWithSequence" in the heading with only sequence', function(done){
      helperFunctions.addClassOnHeading(THIRD_HEADING_POSITION, 'seq');
      done();
    });

    it('adds the class "headingWithAct" in the heading with only act', function(done){
      helperFunctions.addClassOnHeading(FIRST_HEADING_POSITION, 'act');
      helperFunctions.addClassOnHeading(SECOND_HEADING_POSITION, 'act');
      done();
    });
  });

  context('integration with ep_mouse_shortcuts', function(){
    context('when user adds a SCENE', function(){
      before(function (done) {
        action = '#addScene';
        helperFunctions.addSceneMarkToLine(FIRST_ACTION_LINE, action,  done);
      });

      it('adds the class "headingWithSynopsis" in the heading', function(done){
        // the newly heading created is in the second position
        helperFunctions.addClassOnHeading(SECOND_HEADING_POSITION, 'syn');
        done();
      });

      // actually in this test we remove the heading added, so in the second position
      // it's the heading with act as it was before to add a new heading
      undoKeepTheSameTextAndKeepTheClassOnHeading(SECOND_HEADING_POSITION, 'act');
    });

    context('when user adds an ACT in a heading with synopsis', function(){
      before(function (done) {
        action = '#addAct';
        helperFunctions.addSceneMarkToLine(FOURTH_HEADING_LINE, action,  done);
      });

      it('removes the class "headingWithSynopsis" from heading', function(done){
        helperFunctions.removeClassOnHeading(FOURTH_HEADING_POSITION, 'syn');
        done();
      });

      it('adds the class "headingWithAct" in the heading', function(done){
        helperFunctions.addClassOnHeading(FOURTH_HEADING_POSITION, 'act');
        done();
      });

      undoKeepTheSameTextAndKeepTheClassOnHeading(FOURTH_HEADING_POSITION, 'syn');
    });

    context('when user adds an SEQ in a heading with synopsis', function(){
      before(function (done) {
        action = '#addSequence';
        helperFunctions.addSceneMarkToLine(FOURTH_HEADING_LINE, action,  done);
      });

      it('removes the class "headingWithSynopsis" from heading', function(done){
        helperFunctions.removeClassOnHeading(FOURTH_HEADING_POSITION, 'syn');
        done();
      });

      it('adds the class "headingWithSequence" in the heading', function(done){
        helperFunctions.addClassOnHeading(FOURTH_HEADING_POSITION, 'seq');
        done();
      });

      undoKeepTheSameTextAndKeepTheClassOnHeading(FOURTH_HEADING_POSITION, 'syn');
    });

    context('when user adds an ACT in a heading with sequence', function(){
      before(function (done) {
        action = '#addAct';
        helperFunctions.addSceneMarkToLine(THIRD_HEADING_LINE, action,  done);
      });

      it('removes the class "headingWithSequence" from heading', function(done){
        helperFunctions.removeClassOnHeading(THIRD_HEADING_POSITION, 'seq');
        done();
      });

      it('adds the class "headingWithAct" in the heading', function(done){
        helperFunctions.addClassOnHeading(THIRD_HEADING_POSITION, 'act');
        done();
      });

      undoKeepTheSameTextAndKeepTheClassOnHeading(THIRD_HEADING_POSITION, 'seq');
    });
  });

  context('integration with ep_script_scene_marks', function(){
    context('when user removes an act from a heading', function(){
      before(function () {
        var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

        // make the scene mark visible
        sceneMarkUtils.clickOnSceneMarkButtonOfLine(FIRST_HEADING_LINE);

        // click on the act trash icon
        sceneMarkUtils.clickTrashIcon(ACT_NAME_OF_FIRST_HEADING_LINE);
      });

      it('adds the class "headingWithSequence" on the heading', function(done){
        helperFunctions.addClassOnHeading(FIRST_HEADING_POSITION, 'seq');
        done();
      });

      undoKeepTheSameTextAndKeepTheClassOnHeading(FIRST_HEADING_POSITION, 'act');
    });

    context('when user removes a sequence from a heading', function(){
      before(function () {
        var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

        // make the scene mark visible
        sceneMarkUtils.clickOnSceneMarkButtonOfLine(THIRD_HEADING_LINE);

        // click on the act trash icon
        sceneMarkUtils.clickTrashIcon(SEQUENCE_NAME_OF_THIRD_HEADING_LINE);
      });

      it('adds the class "headingWithSynopsis" on the heading', function(done){
        helperFunctions.addClassOnHeading(THIRD_HEADING_POSITION, 'syn');
        done();
      });

      undoKeepTheSameTextAndRemoveTheClassOnHeading(SECOND_HEADING_POSITION, 'seq');
    });

    context('integration with ep_script_scene_marks', function(){
      context('when we remove more than one scene mark using the trash icon', function(){
        before(function(done){
          // we have to reload the pad
          helperFunctions.reloadPad(padId, function(){
            // make the scene marks visible
            var secondHeadingLineNumber = utils.getLineNumberOfElement("heading", 1);
            helperFunctions.clickOnSceneMarkButtonOfLine(secondHeadingLineNumber);

            // delete the act
            var secondActLineNumber = utils.getLineNumberOfElement("act_name", 1);
            helperFunctions.clickTrashIcon(secondActLineNumber);
            // delete the sequence
            var secondSequenceLineNumber = utils.getLineNumberOfElement("sequence_name", 1);
            helperFunctions.clickTrashIcon(secondSequenceLineNumber);
            done();
          });
          this.timeout(10000);
        });

        context("and press undo twice", function(){
          before(function () {
            utils.undo();
            utils.undo();
          });

          it('performs the undo of the two removals', function (done) {
            var inner$ = helper.padInner$;
            var actLines = inner$(".withAct").length;
            // 2 act_names  + 2 act_summaries
            expect(actLines).to.be(4);
            done();
          });
        });
      });
    });
  });

  context('integration with ep_script_elements_transitions', function() {
    context('when user presses cmd + 1', function() {
      before(function (done) {
        utils.placeCaretOnLine(FIRST_ACTION_LINE, function() {
          helperFunctions.pressCmdOne();
          done();
        });
      });

      after(function () {
        utils.undo();
      });

      it('creates a heading with headingWithSynopsis class', function (done) {
        helperFunctions.addClassOnHeading(SECOND_HEADING_POSITION, 'syn');
        done();
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.updateHeadingType = {
  HEADING_TYPE_CLASS: {
    act: '.headingWithAct',
    seq: '.headingWithSequence',
    syn: '.headingWithSynopsis',
  },
  utils: null,
  RIGHT_MOUSE_BUTTON: 3,
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

    // todo use createSM from ep_sm
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

    this.rightClickOnLine(line, function(){
      var $mouseWindow = outer$('.mouseWindow');

      // clicks in the button add sm
      $mouseWindow.find(sceneMarkToAddToLine).click();
      done();
    });
  },
  rightClickOnLine: function(line, cb){
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;
    var element = inner$("div").slice(line, line + 1);
    var $el = chrome$(element);
    var offset = $el.offset();
    var event = jQuery.Event( "mousedown", {
      which: this.RIGHT_MOUSE_BUTTON,
      pageX: offset.left,
      pageY: offset.top
    });
    setTimeout(function() { // it's ugly but without it the caret position it's changed when it triggers the event
      $el.trigger(event);
      cb()
    }, 1000);
  },
  // headingPostion is 1st(0), 2nd(1), 3rd(2) and so on
  addClassOnHeading: function(headingPosition, headingType){
    var inner$ = helper.padInner$;
    var $heading = inner$('div:has(heading)').slice(headingPosition, headingPosition + 1);
    var headingHasClass = $heading.find(this.HEADING_TYPE_CLASS[headingType]).length === 1;
    expect(headingHasClass).to.be(true);
  },
  // headingPostion is 1st(0), 2nd(1), 3rd(2) and so on
  removeClassOnHeading: function(headingPosition, headingType){
    var inner$ = helper.padInner$;
    var $heading = inner$('div:has(heading)').slice(headingPosition, headingPosition + 1);
    var headingHasClass = $heading.find(this.HEADING_TYPE_CLASS[headingType]).length === 1;

    expect($heading.length).to.be(1);
    expect(headingHasClass).to.be(false);
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
  },
  pressCmdOne: function () {
    var transitionsCommandNumber = ep_script_element_transitions_test_helper.commandNumber;
    var shortCut = transitionsCommandNumber.buildShortcut(1);
    shortCut();
  },
  reloadPad: function(padId, cb){
    // wait some time to reload the pad
    setTimeout(function() {
      helper.newPad(cb, padId);
    }, 1000);
  },
  // We pass the heading number so we go up until find the button
  clickOnSceneMarkButtonOfLine: function(headingLineNumber){
    var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;
    sceneMarkUtils.clickOnSceneMarkButtonOfLine(headingLineNumber);
  },
  clickTrashIcon: function(lineNumber) {
    var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;
    sceneMarkUtils.clickTrashIcon(lineNumber);
  },
}