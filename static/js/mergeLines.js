var BACKSPACE = 8;
var DELETE = 46;

exports.keyShouldBeIgnored = function(context){
  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var evt              = context.evt;
  var rep              = context.rep;
  var currentLine      = rep.selStart[0];
  var nextLine         = currentLine + 1;

  if(textSelected(editorInfo)) return false;

  var ignoreKey = false

  if(evt.keyCode === BACKSPACE && evt.type === "keydown") {
    var currentLineIsEmpty = lineIsEmpty(currentLine, rep, attributeManager);
    var caretPosition = getCaretPosition(currentLine, rep, editorInfo, attributeManager);
    var currentLineHasDifferentTypeOfPreviousLine = thisLineTypeIsDifferentFromPreviousLine(currentLine, attributeManager);

    if(caretPosition.beginningOfLine && !currentLineIsEmpty && currentLineHasDifferentTypeOfPreviousLine) {
      ignoreKey = true;
    }
  } else if(evt.keyCode === DELETE && evt.type === "keydown") {
    var nextLineIsEmpty = lineIsEmpty(nextLine, rep, attributeManager);
    var caretPosition = getCaretPosition(currentLine, rep, editorInfo, attributeManager);
    var currentLineHasDifferentTypeOfNextLine = thisLineTypeIsDifferentFromPreviousLine(nextLine, attributeManager);

    if(caretPosition.endOfLine && !nextLineIsEmpty && currentLineHasDifferentTypeOfNextLine) {
      ignoreKey = true;
    }
  }

  return ignoreKey;
}

var textSelected = function(editorInfo) {
  return !editorInfo.ace_isCaret();
}

var lineIsEmpty = function(line, rep, attributeManager){
  var emptyLine = false;
  var lineText = getCurrentLineText(line, rep, attributeManager);
  var lineHasNotText = lineText.trim().length === 0;
  if(lineHasNotText){
    emptyLine = true;
  }

  return emptyLine;
}

var thisLineTypeIsDifferentFromPreviousLine = function(line, attributeManager) {
  var linesHasNotSameElement = false;
  var lineBefore = line - 1;
  var currentLineAttribute = attributeManager.getAttributeOnLine(line, "script_element");
  var previousLineAttribute = attributeManager.getAttributeOnLine(lineBefore , "script_element");
  if (currentLineAttribute !== previousLineAttribute){
    linesHasNotSameElement = true;
  }
  return linesHasNotSameElement;
}

var synchronizeEditorWithUserSelection = function(editorInfo) {
  editorInfo.ace_fastIncorp();
}

var getCaretPosition = function(line, rep, editorInfo, attributeManager) {
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

var getLength = function(line, rep) {
  var nextLine = line + 1;
  var startLineOffset = rep.lines.offsetOfIndex(line);
  var endLineOffset   = rep.lines.offsetOfIndex(nextLine);

  //lineLength without \n
  var lineLength = endLineOffset - startLineOffset - 1;

  return lineLength;
}

var getCurrentLineText = function(currentLine, rep, attributeManager) {
  var currentLineText = rep.lines.atIndex(currentLine).text;
  // if line has marker, it starts with "*". We need to ignore it
  var lineHasMarker = attributeManager.lineHasMarker(currentLine);
  if(lineHasMarker){
    currentLineText = currentLineText.substr(1);
  }
  return currentLineText;
}