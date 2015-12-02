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
  createScriptWith: function(scriptContent, lastLineText, cb) {
    var inner$ = helper.padInner$;

    // set script content
    var $firstLine = inner$("div").first();
    $firstLine.html(scriptContent);

    // wait for Etherpad to finish processing the lines
    helper.waitFor(function(){
      var $lastLine = inner$("div").last();
      return $lastLine.text() === lastLineText;
    }, 2000).done(cb);
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
};
