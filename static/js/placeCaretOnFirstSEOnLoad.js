var utils = require('./utils');
var FIRST_LINE = 0;

exports.init = function(ace) {
  ace.callWithAce(function(ace){
    placeCaretOnTheFirstScriptElement(ace);
    setFocusOnEditor();
  });
}

var setFocusOnEditor = function(){
  utils.getPadInner().find("#innerdocbody").focus();
}

var placeCaretOnTheFirstScriptElement = function(ace) {
  var rep = ace.ace_getRep();
  var $lineOfFirstScriptElement = getFirstScriptElementOfText();
  var lineOfFirstScriptElement = utils.getLineNumberFromDOMLine($lineOfFirstScriptElement, rep);
  var line = rep.lines.atIndex(lineOfFirstScriptElement);
  var firstCharLinePosition = lineHasMarker(line) ? 1 : 0;
  var firstPositionOfLine = [lineOfFirstScriptElement, firstCharLinePosition];
  placeCaretOnLine(ace, firstPositionOfLine);
}

var getFirstScriptElementOfText = function() {
  var $firstLine = utils.getPadInner().find('div').first();
  var $firstScriptElementOfScript = $firstLine;
  var firstLineIsScriptElement = utils.lineIsScriptElement(FIRST_LINE);
  if(!firstLineIsScriptElement){
    $firstScriptElementOfScript = $firstLine.nextUntil(':not(.sceneMark)').last().next();
  }
  return $firstScriptElementOfScript;
}

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretOnElementAndUpdateBrowserSelectionFromRep", function(){
    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}

var lineHasMarker = function(line) {
  return line.lineMarker === 1;
}
