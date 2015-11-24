var BACKSPACE = 8;
var DELETE = 46;

exports.keyShouldBeIgnored = function(context){
  var rep = context.rep;
  var currentLine = rep.selStart[0];
  var editorInfo = context.editorInfo;
  var attributeManager = context.documentAttributeManager;

  var evt = context.evt;
  var ignoreKey = false
  var nextLine = currentLine + 1;

  var elementFromCurrentLineIsDifferentOfLineBefore = checkElementOfLines(currentLine, attributeManager);
  var elementFromCurrentLineIsDifferentOfLineAfter = checkElementOfLines(currentLine + 1, attributeManager);

  if(evt.keyCode === BACKSPACE && elementFromCurrentLineIsDifferentOfLineBefore){
    var lineIsEmpty = checkLineEmpty(currentLine, rep, attributeManager);
    var position = caretPosition(currentLine, rep, editorInfo, attributeManager);
    if(position.beginningOfLine && !lineIsEmpty) {
      ignoreKey = true;
    }
  }else if(evt.keyCode === DELETE && elementFromCurrentLineIsDifferentOfLineAfter){
    var nextLineIsEmpty = checkLineEmpty(nextLine, rep, attributeManager);
    var position = caretPosition(currentLine, rep, editorInfo, attributeManager);
    if(position.endOfLine && !nextLineIsEmpty){
      ignoreKey = true;
    }
  }

  return ignoreKey;
}

var checkLineEmpty = function(line, rep, attributeManager){
  var emptyLine = false;
  var lineText = getCurrentLineText(line, rep, attributeManager);
  var lineHasNotText = lineText.trim().length === 0;
  if(lineHasNotText){
    emptyLine = true;
  }

  return emptyLine;
}

var checkElementOfLines = function(line, attributeManager) {
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

var getCurrentLineText = function(currentLine, rep, attributeManager) {
  var currentLineText = rep.lines.atIndex(currentLine).text;
  // if line has marker, it starts with "*". We need to ignore it
  var lineHasMarker = attributeManager.lineHasMarker(currentLine);
  if(lineHasMarker){
    currentLineText = currentLineText.substr(1);
  }
  return currentLineText;
}