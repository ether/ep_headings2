describe('ep_script_elements - handle paste on script elements', function () {
  var utils, helperFunctions;
  var SHOT_LINE = 6;
  var GENERAL_LINE = 9;

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

    context('and user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  context('when user copies a SE followed by a SM hidden with triple click and pastes in an empty SE', function() {
    before(function (done) {
      utils.placeCaretInTheBeginningOfLine(SHOT_LINE, function(){
        // make shot line empty
        helperFunctions.simulatePasteOfLineWithTripleClickOnEmptyLine(SHOT_LINE, done);
      });
    });

    it('pastes the element copied and removes the scene marks', function (done) {
      helper.waitFor(function(){
        var $targetLine = helperFunctions.getLineTarget(SHOT_LINE);
        var targetLineText = $targetLine.text();
        return targetLineText === "shot";
      }).done(function(){
        utils.validateLineTextAndType(SHOT_LINE - 1, '------', 'dialogue');
        utils.validateLineTextAndType(SHOT_LINE, 'shot', 'shot');
        utils.validateLineTextAndType(SHOT_LINE + 1, '------', 'dialogue');
        done();
      });
    });

    context('and user performs undo', function(){
      before(function (done) {
        utils.undo();
        done();
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

    context('and user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  context('when user copies part of a scene mark', function(){
    before(function (done) {
      var _this = this;
      utils.placeCaretInTheBeginningOfLine(GENERAL_LINE, function(){
        helperFunctions.simulatePasteOfPartialSceneMark(GENERAL_LINE, function(){
          helperFunctions.waitCollectLinesPasted(_this, GENERAL_LINE, done);
        });
      });
    });
    it('pastes the scene marks as actions', function(done){
      utils.validateLineTextAndType(GENERAL_LINE, 'asummary', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 1, 'sname', 'action');
      done();
    });

    context('and user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  // user can copy part of an act, e.g. from sequence_name until the heading,
  // this case we can consider as a full scene mark
  context('when user copies part of a scene mark and its heading', function(){
    before(function (done) {
      var _this = this;
      utils.placeCaretInTheBeginningOfLine(GENERAL_LINE, function(){
        helperFunctions.simulatePasteOfPartialSceneMarkAndHeading(GENERAL_LINE, function(){
          helperFunctions.waitCollectLinesPasted(_this, GENERAL_LINE, done);
        });
      });
    });
    it('pastes the scene marks as actions and keeps the heading', function(done){
      utils.validateLineTextAndType(GENERAL_LINE, 'asummary', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 1, 'sname', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 2, 'ssummary', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 3, 'heading', 'heading');
      done();
    });

    context('and user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  context('when user copies all the scene mark without a heading', function(){
    before(function (done) {
      var _this = this;
      utils.placeCaretInTheBeginningOfLine(GENERAL_LINE, function(){
        helperFunctions.simulatePasteFullSceneMarkWithoutAHeading(GENERAL_LINE, function(){
          helperFunctions.waitCollectLinesPasted(_this, GENERAL_LINE, done);
        });
      });
    });
    it('pastes the scene marks as actions', function(done){
      utils.validateLineTextAndType(GENERAL_LINE, 'aname', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 1, 'asummary', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 2, 'sname', 'action');
      utils.validateLineTextAndType(GENERAL_LINE + 3, 'ssummary', 'action');
      done();
    });

    context('and user performs undo', function(){
      before(function () {
        utils.undo();
      });

      it('returns to the original text', function(done){
        helperFunctions.hasTheOriginalText();
        done();
      });
    });
  });

  context('when user copies all the scene mark and its heading', function(){
    before(function (done) {
      var _this = this;
      utils.placeCaretInTheBeginningOfLine(GENERAL_LINE, function(){
        helperFunctions.simulatePasteFullSceneMarkWithAHeading(GENERAL_LINE, function(){
          helperFunctions.waitCollectLinesPasted(_this, GENERAL_LINE, done);
        });
      });
    });
    it('pastes the scene marks and the heading', function(done){
      utils.validateLineTextAndType(GENERAL_LINE, 'aname', 'act_name');
      utils.validateLineTextAndType(GENERAL_LINE + 1, 'asummary', 'act_summary');
      utils.validateLineTextAndType(GENERAL_LINE + 2, 'sname', 'sequence_name');
      utils.validateLineTextAndType(GENERAL_LINE + 3, 'ssummary', 'sequence_summary');
      utils.validateLineTextAndType(GENERAL_LINE + 4, 'heading', 'heading');
      done();
    });
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
    var generalText   = "general";
    var lastLineText  = lastHeading;

    var act            = SMUtils.act(smText);
    var sequence       = SMUtils.sequence(smText);
    var heading        = utils.heading(headingText);
    var dialogue       = utils.dialogue(dialogueText);
    var shot           = utils.shot(shotText);
    var action         = utils.action(actionText);
    var general        = utils.general(generalText)
    var secondAct      = SMUtils.act(secondSMText);
    var secondSequence = SMUtils.sequence(secondSMText);
    var secondHeading  = utils.heading(lastHeading);

    var script = act + sequence + heading +  dialogue + shot + dialogue +
     action + general + secondAct + secondSequence + secondHeading;

    utils.createScriptWith(script, lastLineText, done)

  },
  simulatePasteOfLineWithTripleClickOnEmptyLine: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div><shot>shot' +
        '<div class="sceneMark hidden"><sm_icon class="scene_mark_button--act"><empty /></sm_icon>' +
        '<trash_icon><empty /></trash_icon><act_name><br></act_name></div>' +
        '<div class="sceneMark hidden"><act_summary><br></act_summary></div>' +
        '<div class="sceneMark hidden"><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><sequence_name><br></sequence_name></div>' +
        '<div class="sceneMark hidden"><sequence_summary><br></sequence_summary></div>' +
        '<div></div>' +
      '</shot></div>';
    this.pasteTextOnLine(copiedHTML, lineTargetOfPaste, cb);
  },
  simulatePasteOfLineWithTripleClick: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div><action><span>action</span></div>' +
      '<div><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><act_name><span /></act_name></div>' +
      '<div><act_summary><span /></act_summary></div>' +
      '<div><sm_icon><empty /></sm_icon><trash_icon><empty /></trash_icon><sequence_name><span /></sequence_name></div>' +
      '<div><sequence_summary><span /></sequence_summary></div>' +
      '<div><heading /></div>';
    this.pasteTextOnChildren(copiedHTML, lineTargetOfPaste, cb);
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
    this.pasteTextOnChildren(copiedHTML, lineTargetOfPaste, cb);
  },
  simulatePasteOfPartialSceneMark: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div><act_summary><span>asummary</span></act_summary></div>' +
      '<div>' +
        '<sm_icon><empty></empty></sm_icon>' +
        '<trash_icon><empty></empty></trash_icon>' +
        '<sequence_name><span>sname</span></sequence_name>' +
      '</div>';
    this.pasteTextOnLine(copiedHTML, lineTargetOfPaste, cb)
  },
  simulatePasteOfPartialSceneMarkAndHeading: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div><act_summary><span>asummary</span></act_summary></div>' +
      '<div>' +
        '<sm_icon><empty></empty></sm_icon>' +
        '<trash_icon><empty></empty></trash_icon>' +
        '<sequence_name><span>sname</span></sequence_name>' +
      '</div>' +
      '<div><act_summary><span>ssummary</span></act_summary></div>' +
      '<div><heading><span>heading</span></heading></div>';
    this.pasteTextOnLine(copiedHTML, lineTargetOfPaste, cb)
  },
  simulatePasteFullSceneMarkWithoutAHeading: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div>' +
        '<sm_icon><empty></empty></sm_icon>' +
        '<trash_icon><empty></empty></trash_icon>' +
        '<act_name><span>aname</span></act_name>' +
      '</div>' +
      '<div><act_summary><span>asummary</span></act_summary></div>' +
      '<div>' +
        '<sm_icon><empty></empty></sm_icon>' +
        '<trash_icon><empty></empty></trash_icon>' +
        '<sequence_name><span>sname</span></sequence_name>' +
      '</div>' +
      '<div><act_summary><span>ssummary</span></act_summary></div>';
    this.pasteTextOnLine(copiedHTML, lineTargetOfPaste, cb)
  },
  simulatePasteFullSceneMarkWithAHeading: function(lineTargetOfPaste, cb) {
    var copiedHTML =
      '<div>' +
        '<sm_icon><empty></empty></sm_icon>' +
        '<trash_icon><empty></empty></trash_icon>' +
        '<act_name><span>aname</span></act_name>' +
      '</div>' +
      '<div><act_summary><span>asummary</span></act_summary></div>' +
      '<div>' +
        '<sm_icon><empty></empty></sm_icon>' +
        '<trash_icon><empty></empty></trash_icon>' +
        '<sequence_name><span>sname</span></sequence_name>' +
      '</div>' +
      '<div><sequence_summary><span>ssummary</span></sequence_summary></div>' +
      '<div><heading><span>heading</span></heading></div>';
    this.pasteTextOnLine(copiedHTML, lineTargetOfPaste, cb)
  },
  getLineTarget: function(line) {
    return helper.padInner$("div").slice(line, line + 1);
  },
  pasteTextOnLine: function(htmlToPaste, lineTargetOfPaste, cb) {
    var _this = this;
    setTimeout(function() {
      _this.triggerEventPaste();

      // WARNING: here we assume the element has only one children, with headings won't work
      var $lineTarget = _this.getLineTarget(lineTargetOfPaste);
      $lineTarget.html(htmlToPaste);
      cb();
    }, 1000);
  },
  pasteTextOnChildren: function(htmlToPaste, lineTargetOfPaste, cb) {
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
    utils.validateLineTextAndType(9, 'general', 'general');
    utils.validateLineTextAndType(10, 'ACT OF SM 2 TEXT', 'act_name');
    utils.validateLineTextAndType(11, 'SUMMARY OF ACT OF SM 2 TEXT', 'act_summary');
    utils.validateLineTextAndType(12, 'SEQUENCE OF SM 2 TEXT', 'sequence_name');
    utils.validateLineTextAndType(13, 'SUMMARY OF SEQUENCE OF SM 2 TEXT', 'sequence_summary');
    utils.validateLineTextAndType(14, 'HEADING 2', 'heading');
  },
}