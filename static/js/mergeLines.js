BACKSPACE = 8;
DELETE = 46;

exports.keyShouldBeIgnored = function(context){
  var rep = context.rep;
  var currentLine = rep.selStart[0];
  var editorInfo = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var position = caretPosition(currentLine, rep, editorInfo, attributeManager);

  // if the caret is in the middle of a line, handle delete and backspace as usual
  if (position.middleOfLine) return false;

  var evt = context.evt;
  var ignoreKey = false

  var elementFromCurrentLineIsDifferentOfLineBefore = checkElementOfLines(currentLine, attributeManager);
  var elementFromCurrentLineIsDifferentOfLineAfter = checkElementOfLines(currentLine + 1, attributeManager);

  if(evt.keyCode === BACKSPACE && elementFromCurrentLineIsDifferentOfLineBefore && position.beginningOfLine){
    ignoreKey = true;
  }else if(evt.keyCode === DELETE && elementFromCurrentLineIsDifferentOfLineAfter && position.endOfLine) {
    ignoreKey = true;
  }
  return ignoreKey;
}

checkElementOfLines = function(line, attributeManager) {
  var linesHasNotSameElement = false;
  var lineBefore = line - 1;
  var currentLineAttribute = attributeManager.getAttributeOnLine(line, "script_element");
  var beforeCurrentLineAttribute = attributeManager.getAttributeOnLine(lineBefore , "script_element");
  if (currentLineAttribute !== beforeCurrentLineAttribute){
    linesHasNotSameElement = true;
  }
  return linesHasNotSameElement;
}

function synchronizeEditorWithUserSelection(editorInfo) {
  editorInfo.ace_fastIncorp();
}

function caretPosition(line, rep, editorInfo, attributeManager) {
  synchronizeEditorWithUserSelection(editorInfo);
  var lineLength = getLength(line, rep);
  var caretPosition = editorInfo.ace_caretColumn();
  var lineHasMarker = attributeManager.lineHasMarker(line);
  var firstPostionOfLine = lineHasMarker ? 1 : 0;

  var atBeginningOfLine = (caretPosition === firstPostionOfLine);
  var atEndOfLine = (caretPosition === lineLength);

  return {
    beginningOfLine: atBeginningOfLine,
    middleOfLine: (!atBeginningOfLine && !atEndOfLine),
    endOfLine: atEndOfLine,
  }
}

function getLength(line, rep) {
  var nextLine = line + 1;
  var startLineOffset = rep.lines.offsetOfIndex(line);
  var endLineOffset   = rep.lines.offsetOfIndex(nextLine);

  //lineLength without \n
  var lineLength = endLineOffset - startLineOffset - 1;

  return lineLength;
}
