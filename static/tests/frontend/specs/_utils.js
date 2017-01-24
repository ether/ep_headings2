var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.utils = {
  act: function(text) {
    return this.actName(text) + this.actSummary(text);
  },
  actName: function(text) {
    return "<act_name>" + text + "</act_name><br/>";
  },
  actSummary: function(text){
    return "<act_summary>" + text + "</act_summary><br/>"
  },
  sequence: function (text) {
    return this.sequenceName(text) + this.sequenceSummary(text);
  },
  sequenceName: function(text) {
    return "<sequence_name>" + text + "</sequence_name><br/>";
  },
  sequenceSummary: function(text){
    return "<sequence_summary>" + text + "</sequence_summary><br/>";
  },
  synopsis: function(text) {
    return this.sceneName(text) + this.sceneSummary(text);
  },
  sceneName: function(text) {
    return "<scene_name>" + text + "</scene_name><br/>";
  },
  sceneSummary: function(text) {
    return "<scene_summary>" + text + "</scene_summary><br/>";
  },
  heading: function(text) {
    return "<heading>" + text + "</heading><br/>";
  },
  action: function(text) {
    return "<action>" + text + "</action><br/>";
  },
  parenthetical: function(text) {
    return "<parenthetical>" + text + "</parenthetical><br/>";
  },
  character: function(text) {
    return "<character>" + text + "</character><br/>";
  },
  dialogue: function(text) {
    return "<dialogue>" + text + "</dialogue><br/>";
  },
  shot: function(text) {
    return "<shot>" + text + "</shot><br/>";
  },
  transition: function(text) {
    return "<transition>" + text + "</transition><br/>";
  },
  general: function(text) {
    return text + "<br/>";
  },
  createScriptWith: function(scriptContent, lastLineText, cb) {
    var inner$ = helper.padInner$;
    var utils = ep_script_elements_test_helper.utils;

    // set script content
    var $firstLine = inner$("div").first();
    $firstLine.html(scriptContent);

    // wait for Etherpad to finish processing the lines
    helper.waitFor(function(){
      var $lastLine = inner$("div").last();
      return utils.cleanText($lastLine.text()) === lastLineText;
    }, 2000).done(cb);
  },

  /**** vars and functions to change element type of a line: ****/
  GENERAL: 'general',
  HEADING: 'heading',
  ACTION: 'action',
  CHARACTER: 'character',
  PARENTHETICAL: 'parenthetical',
  DIALOGUE: 'dialogue',
  TRANSITION: 'transition',
  SHOT: 'shot',
  TARGET_ELEMENT: {
    'general'       : { val : '-1' },
    'heading'       : { val : '0' },
    'action'        : { val : '1' },
    'character'     : { val : '2' },
    'parenthetical' : { val : '3' },
    'dialogue'      : { val : '4' },
    'transition'    : { val : '5' },
    'shot'          : { val : '6' }
  },
  valOf: function(tag) {
    return this.TARGET_ELEMENT[tag].val;
  },
  changeToElement: function(tag, callback, lineNum){
    lineNum = lineNum || 0;
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;
    var targetElement = ep_script_elements_test_helper.utils.TARGET_ELEMENT[tag];

    chrome$('#script_element-selection').val(targetElement.val);
    chrome$('#script_element-selection').change();

    helper.waitFor(function() {
      var $textElement = ep_script_elements_test_helper.utils.getLine(lineNum);
      return tag === 'general' || $textElement.find(tag).length > 0;
    }
    // this helper.waitFor needs a little more time to finish, so we give it 2s
    , 2000).done(callback);
  },
  changeToElementAndCheckNewLinePosition: function(tag, callback, lineTarget, newLinePosition){
    lineTarget = lineTarget || 0;
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;
    var targetElement = ep_script_elements_test_helper.utils.TARGET_ELEMENT[tag];

    chrome$('#script_element-selection').val(targetElement.val);
    chrome$('#script_element-selection').change();

    helper.waitFor(function() {
      var $textElement = ep_script_elements_test_helper.utils.getLine(newLinePosition);
      return tag === 'general' || $textElement.find(tag).length > 0;
    }
    // this helper.waitFor needs a little more time to finish, so we give it 2s
    , 2000).done(callback);
  },


  cleanText: function(text) {
    return text.replace(/\s/gi, " ");
  },

  buildStringWithLength: function(length, text) {
    return text.repeat(length);
  },

  buildScriptWithGenerals: function(text, howMany) {
    var utils = ep_script_page_view_test_helper.utils;

    var script = "";
    for (var i = 0; i < howMany; i++) {
      script += utils.general(text);
    }

    return script;
  },

  cleanPad: function(callback) {
    var inner$ = helper.padInner$;
    var $padContent = inner$("#innerdocbody");
    $padContent.html("");

    // wait for Etherpad to re-create first line
    helper.waitFor(function(){
      var lineNumber = inner$("div").length;
      return lineNumber === 1;
    }, 2000).done(callback);
  },

  getLineWhereCaretIs: function() {
    var inner$ = helper.padInner$;
    var nodeWhereCaretIs = inner$.document.getSelection().anchorNode;
    var $lineWhereCaretIs = $(nodeWhereCaretIs).closest("div");

    return $lineWhereCaretIs;
  },
  getColumnWhereCaretIs: function() {
    var inner$ = helper.padInner$;
    var columnWhereCaretIsOnElement = inner$.document.getSelection().anchorOffset;

    return columnWhereCaretIsOnElement;
  },
  getSelectedText: function() {
    var inner$ = helper.padInner$;
    var selectedText = inner$.document.getSelection().toString();

    return selectedText;
  },

  // first line === getLine(0)
  // second line === getLine(1)
  // ...
  getLine: function(lineNum) {
    var inner$ = helper.padInner$;
    var line = inner$("div").first();
    for (var i = lineNum - 1; i >= 0; i--) {
      line = line.next();
    }
    return line;
  },

  placeCaretOnLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}', cb);
  },
  placeCaretInTheBeginningOfLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}{leftarrow}', cb);
  },
  placeCaretAtTheEndOfLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}{rightarrow}', cb);
  },
  placeCaretInTheMiddleOfLine: function(lineNum, cb) {
    ep_script_elements_test_helper.utils._moveCaretToLine(lineNum, '{selectall}{rightarrow}{leftarrow}', cb);
  },
  _moveCaretToLine: function(lineNum, sendkeysCommand, cb) {
    var self = ep_script_elements_test_helper.utils;
    var $targetLine = self.getLine(lineNum);
    $targetLine.sendkeys(sendkeysCommand);

    helper.waitFor(function() {
      var $targetLine = self.getLine(lineNum);
      var $lineWhereCaretIs = self.getLineWhereCaretIs();

      return $targetLine.get(0) === $lineWhereCaretIs.get(0);
    }).done(cb);
  },

  pressKey: function(CODE) {
    var inner$ = helper.padInner$;
    if(inner$(window)[0].bowser.firefox || inner$(window)[0].bowser.modernIE){ // if it's a mozilla or IE
      var evtType = "keypress";
    }else{
      var evtType = "keydown";
    }
    var e = inner$.Event(evtType);
    e.keyCode = CODE;
    inner$("#innerdocbody").trigger(e);
  },
  buildUndoRedo: function(isRedo) {
    var inner$ = helper.padInner$;
    if(inner$(window)[0].bowser.firefox || inner$(window)[0].bowser.modernIE){ // if it's a mozilla or IE
      var evtType = "keypress";
    }else{
      var evtType = "keydown";
    }
    var e = inner$.Event(evtType);
    e.ctrlKey = true;
    e.shiftKey = isRedo;
    e.which = "z".charCodeAt(0);
    e.keyCode = 90;
    inner$("#innerdocbody").trigger(e);
  },
  undo: function() {
    ep_script_elements_test_helper.utils.buildUndoRedo(false);
  },
  redo: function() {
    ep_script_elements_test_helper.utils.buildUndoRedo(true);
  },
  validateLineTextAndType: function(lineNumber, expectedText, expectType) {
    var $line = this.getLine(lineNumber);
    var actualText = this.cleanText($line.text());

    expect(actualText).to.be(expectedText);

    // use fail() to return a clearer failure message
    var actualType = this.getLineType(lineNumber);
    if (actualType !== expectType) {
      var failureMessage = "Expected line '" + actualText + "' to be " + expectType + ', found ' + actualType + ' instead';
      expect().fail(function() { return failureMessage });
    }
  },

  SCRIPT_ELEMENT_TYPE_SELECTOR: 'heading, action, character, dialogue, parenthetical, shot, transition',
  SCENE_MARK_TYPE_SELECTOR: 'act_name, act_summary, sequence_name, sequence_summary, scene_name, scene_summary',
  getLineType: function(lineNumber) {
    var sceneElementsAndSceneMarks = this.SCRIPT_ELEMENT_TYPE_SELECTOR + ',' + this.SCENE_MARK_TYPE_SELECTOR;
    var $line = this.getLine(lineNumber);
    var $type = $line.find(sceneElementsAndSceneMarks).first();

    return $type.length !== 0 ? $type.get(0).tagName.toLowerCase() : this.GENERAL;
  },

  // first  - position = 0
  // second - position = 1
  getLineNumberOfElement: function(element, position){
    var inner$ = helper.padInner$;
    var $allDivs = inner$('div');
    var $element = inner$(element).eq(position);
    var $elementDiv = $element.closest('div').get(0);
    return _.indexOf($allDivs, $elementDiv);
  },
};
