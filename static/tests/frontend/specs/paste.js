describe('ep_script_elements - handle paste on script elements', function () {
  var utils, helperFunctions;
  var SHOT_LINE = 6;
  var GENERAL_LINE = 9;

  before(function (done) {
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.pasteOnSE;
    helperFunctions.createNewPadAndFillWithContent(this, done);
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
        var $targetLine = utils.getLine(SHOT_LINE);
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
  utils: null,
  createNewPadAndFillWithContent: function(test, done) {
    var self = this;
    helper.newPad(function(){
      self.utils = ep_script_elements_test_helper.utils;
      self.createScript(done);
    });
    test.timeout(60000);
  },
  createScript: function(done) {
    var smText        = "SM TEXT";
    var secondSMText  = "SM 2 TEXT"
    var headingText   = "HEADING";
    var lastHeading   = "HEADING 2"
    var dialogueText  = "------";
    var shotText      = ' ';
    var actionText    = "action";
    var generalText   = "general";
    var lastLineText  = lastHeading;

    var act            = this.utils.act(smText);
    var sequence       = this.utils.sequence(smText);
    var heading        = this.utils.heading(headingText);
    var dialogue       = this.utils.dialogue(dialogueText);
    var shot           = this.utils.shot(shotText);
    var action         = this.utils.action(actionText);
    var general        = this.utils.general(generalText)
    var secondAct      = this.utils.act(secondSMText);
    var secondSequence = this.utils.sequence(secondSMText);
    var secondHeading  = this.utils.heading(lastHeading);

    var script = act + sequence + heading +  dialogue + shot + dialogue +
     action + general + secondAct + secondSequence + secondHeading;

    this.utils.createScriptWith(script, lastLineText, done)

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
  pasteTextOnLine: function(htmlToPaste, lineTargetOfPaste, cb) {
    var _this = this;
    setTimeout(function() {
      _this.triggerEventPaste(lineTargetOfPaste);

      // WARNING: here we assume the element has only one children, with headings won't work
      var $lineTarget = _this.utils.getLine(lineTargetOfPaste);
      $lineTarget.html(htmlToPaste);
      cb();
    }, 1000);
  },
  pasteTextOnChildren: function(htmlToPaste, lineTargetOfPaste, cb) {
    var _this = this;
    setTimeout(function() {
      _this.triggerEventPaste(lineTargetOfPaste);

      // WARNING: here we assume the element has only one children, with headings won't work
      var $lineTarget = _this.utils.getLine(lineTargetOfPaste).children().first();
      $lineTarget.html(htmlToPaste);
      cb();
    }, 1000);
  },
  triggerEventPaste: function(lineTargetOfPaste) {
    var event = $.Event("paste");
    var e = { clipboardData: { getData: function(any) { return;} } };
    event.originalEvent = e;
    var $firstLine = this.utils.getLine(lineTargetOfPaste);
    $firstLine.trigger(event);
  },
  waitCollectLinesPasted: function(test, lineTarget, done) {
    var _this = this;
    test.timeout(10000);
    helper.waitFor(function(){
      var $lineTarget = _this.utils.getLine(lineTarget);
      var createdNewLines = $lineTarget.find("div").length === 0;
      return createdNewLines;
    }, 5000).done(done);
  },
  hasTheOriginalText: function() {
    this.utils.validateLineTextAndType(0  , 'SM TEXT'   , 'act_name');
    this.utils.validateLineTextAndType(1  , 'SM TEXT'   , 'act_summary');
    this.utils.validateLineTextAndType(2  , 'SM TEXT'   , 'sequence_name');
    this.utils.validateLineTextAndType(3  , 'SM TEXT'   , 'sequence_summary');
    this.utils.validateLineTextAndType(4  , 'HEADING'   , 'heading');
    this.utils.validateLineTextAndType(5  , '------'    , 'dialogue');
    this.utils.validateLineTextAndType(6  , ' '         , 'shot');
    this.utils.validateLineTextAndType(7  , '------'    , 'dialogue');
    this.utils.validateLineTextAndType(8  , 'action'    , 'action');
    this.utils.validateLineTextAndType(9  , 'general'   , 'general');
    this.utils.validateLineTextAndType(10 , 'SM 2 TEXT' , 'act_name');
    this.utils.validateLineTextAndType(11 , 'SM 2 TEXT' , 'act_summary');
    this.utils.validateLineTextAndType(12 , 'SM 2 TEXT' , 'sequence_name');
    this.utils.validateLineTextAndType(13 , 'SM 2 TEXT' , 'sequence_summary');
    this.utils.validateLineTextAndType(14 , 'HEADING 2' , 'heading');
  },
}