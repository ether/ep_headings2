describe('ep_script_elements - handle paste on script elements', function () {
  var utils, helperFunctions;
  var SHOT_LINE = 6;

  before(function (done) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.pasteOnSE;
    helper.newPad(function(){
      helperFunctions.createScript(done);
    });
    this.timeout(60000);
  });

  context('when user copies a script element followed by a scene mark hidden with triple click', function () {
    before(function (done) {
      var _this = this;
      utils.placeCaretInTheBeginningOfLine(SHOT_LINE, function(){
        helperFunctions.simulatePasteOfLineWithTripleClick(SHOT_LINE, function(){
          helperFunctions.waitCollectLinesPasted(_this, SHOT_LINE, done);
        });
      });
    });

    it('pastes the line with one line break', function (done) {
      utils.validateLineTextAndType(SHOT_LINE, 'action', 'shot');
      utils.validateLineTextAndType(SHOT_LINE + 1, '', 'general');
      utils.validateLineTextAndType(SHOT_LINE + 2, '------', 'dialogue');
      done();
    });

    context('when user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  context('when user copies a selection with a scene mark hidden', function(){
    before(function (done) {
      var _this = this;
      utils.placeCaretInTheBeginningOfLine(SHOT_LINE, function(){
        helperFunctions.simulatePasteOfASelectionIncludingASMHidden(SHOT_LINE, function(){
          helperFunctions.waitCollectLinesPasted(_this, SHOT_LINE, done);
        });
      });
    });

    it('pastes the elements visible', function(done){
      utils.validateLineTextAndType(SHOT_LINE, 'action', 'shot');
      utils.validateLineTextAndType(SHOT_LINE + 1, 'HEADING', 'heading');
      utils.validateLineTextAndType(SHOT_LINE + 2, 'action 2', 'action');
      utils.validateLineTextAndType(SHOT_LINE + 3, '------', 'dialogue');
      done();
    });

    context('when user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  // TODO
  context('when user copies part of a scene mark', function(){

  });

  // TODO
  // user can copy part of an act, e.g. from sequence_name until the heading,
  // this case we can consider as a full scene mark
  context('when user copies part of a scene mark and its heading', function(){

  });

  // TODO
  context('when user copies all the scene mark and its heading', function(){

  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.pasteOnSE = {
  createScript: function(done) {
    var utils = ep_script_elements_test_helper.utils;
    var SMUtils = ep_script_scene_marks_test_helper.utils;

    var smText        = "SM TEXT";
    var secondSMText  = "SM 2 TEXT"
    var headingText   = "HEADING";
    var lastHeading   = "HEADING 2"
    var dialogueText  = "------";
    var shotText      = ' ';
    var actionText    = "action";
    var lastLineText  = lastHeading;

    var act            = SMUtils.act(smText);
    var sequence       = SMUtils.sequence(smText);
    var heading        = utils.heading(headingText);
    var dialogue       = utils.dialogue(dialogueText);
    var shot           = utils.shot(shotText);
    var action         = utils.action(actionText);
    var secondAct      = SMUtils.act(secondSMText);
    var secondSequence = SMUtils.sequence(secondSMText);
    var secondHeading  = utils.heading(lastHeading);

    var script = act + sequence + heading +  dialogue + shot + dialogue +
     action + secondAct + secondSequence + secondHeading;

    utils.createScriptWith(script, lastLineText, done)

  },
  simulatePasteOfLineWithTripleClick: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div><action><span>action</span></div>' +
      '<div><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><act_name><span /></act_name></div>' +
      '<div><act_summary><span /></act_summary></div>' +
      '<div><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><sequence_name><span /></sequence_name></div>' +
      '<div><sequence_summary><span /></sequence_summary></div>' +
      '<div><heading /></div>';
    this.pasteText(copiedHTML, lineTargetOfPaste, cb);
  },
  simulatePasteOfASelectionIncludingASMHidden: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div><action><span>action</span></div>' +
      '<div><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><act_name><span /></act_name></div>' +
      '<div><act_summary><span /></act_summary></div>' +
      '<div><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><sequence_name><span /></sequence_name></div>' +
      '<div><sequence_summary><span /></sequence_summary></div>' +
      '<div><heading><span>HEADING</span></heading></div>' +
      '<div><action><span>action 2</span></action></div>';
    this.pasteText(copiedHTML, lineTargetOfPaste, cb);
  },
  getLineTarget: function(line) {
    return helper.padInner$("div").slice(line, line + 1);
  },
  pasteText: function(htmlToPaste, lineTargetOfPaste, cb) {
    var _this = this;
    setTimeout(function() {
      _this.triggerEventPaste();

      // WARNING: here we assume the element has only one children, with headings won't work
      var $lineTarget = _this.getLineTarget(lineTargetOfPaste).children();
      $lineTarget.html(htmlToPaste);
      cb();
    }, 1000);
  },
  triggerEventPaste: function() {
    var event = $.Event("paste");
    var e = { clipboardData: { getData: function(any) { return;} } };
    event.originalEvent = e;
    var $firstLine = this.getLineTarget(1);
    $firstLine.trigger(event);
  },
  waitCollectLinesPasted: function(test, lineTarget, done) {
    var _this = this;
    test.timeout(10000);
    helper.waitFor(function(){
      var $lineTarget = _this.getLineTarget(lineTarget);
      var createdNewLines = $lineTarget.find("div").length === 0;
      return createdNewLines;
    }, 5000).done(done);
  },
  hasTheOriginalText: function() {
    var utils = ep_script_elements_test_helper.utils;

    utils.validateLineTextAndType(0, 'ACT OF SM TEXT', 'act_name');
    utils.validateLineTextAndType(1, 'SUMMARY OF ACT OF SM TEXT', 'act_summary');
    utils.validateLineTextAndType(2, 'SEQUENCE OF SM TEXT', 'sequence_name');
    utils.validateLineTextAndType(3, 'SUMMARY OF SEQUENCE OF SM TEXT', 'sequence_summary');
    utils.validateLineTextAndType(4, 'HEADING', 'heading');
    utils.validateLineTextAndType(5, '------', 'dialogue');
    utils.validateLineTextAndType(6, ' ', 'shot');
    utils.validateLineTextAndType(7, '------', 'dialogue');
    utils.validateLineTextAndType(8, 'action', 'action');
    utils.validateLineTextAndType(9, 'ACT OF SM 2 TEXT', 'act_name');
    utils.validateLineTextAndType(10, 'SUMMARY OF ACT OF SM 2 TEXT', 'act_summary');
    utils.validateLineTextAndType(11, 'SEQUENCE OF SM 2 TEXT', 'sequence_name');
    utils.validateLineTextAndType(12, 'SUMMARY OF SEQUENCE OF SM 2 TEXT', 'sequence_summary');
    utils.validateLineTextAndType(13, 'HEADING 2', 'heading');
  },
}