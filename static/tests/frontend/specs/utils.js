var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.utils = {
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
    var utils =  ep_script_elements_test_helper.utils;
    var $targetLine = utils.getLine(lineNum);
    $targetLine.sendkeys("{selectall}");

    helper.waitFor(function() {
      var $targetLine = utils.getLine(lineNum);
      var $lineWhereCaretIs = utils.getLineWhereCaretIs();

      return $targetLine.get(0) === $lineWhereCaretIs.get(0);
    }).done(cb);
  },

  placeCaretInTheBeginningOfLine: function(lineNum, cb) {
    var utils =  ep_script_elements_test_helper.utils;
    var $targetLine = utils.getLine(lineNum);
    $targetLine.sendkeys("{selectall}{leftarrow}");
    helper.waitFor(function() {
      var $targetLine = utils.getLine(lineNum);
      var $lineWhereCaretIs = utils.getLineWhereCaretIs();

      return $targetLine.get(0) === $lineWhereCaretIs.get(0);
    }).done(cb);
  },

  placeCaretAtTheEndOfLine: function(lineNum, cb) {
    var utils =  ep_script_elements_test_helper.utils;
    var $targetLine = utils.getLine(lineNum);
    $targetLine.sendkeys("{selectall}{rightarrow}");
    helper.waitFor(function() {
      var $targetLine = utils.getLine(lineNum);
      var $lineWhereCaretIs = utils.getLineWhereCaretIs();

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
    var actualText = $line.text();

    expect(actualText).to.be(expectedText);

    // use fail() to return a clearer failure message
    if ($line.find(expectType).length !== 1) {
      var failureMessage = "Expected line '" + actualText + "' to be " + expectType;
      expect().fail(function() { return failureMessage });
    }
  },
  // first  - position = 0
  // second - position = 1
  getLineNumberOfElement: function(element, position){
    var inner$ = helper.padInner$;
    var $allDivs = inner$('div');
    var $element = inner$(element).slice(position, position + 1);
    var $elementDiv = $element.closest('div').get(0);
    return _.indexOf($allDivs, $elementDiv);
  },
};
