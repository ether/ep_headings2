var BACKSPACE = 8;
var DELETE = 46;

exports.getMergeEventInfo = function(context) {
  var mergeEventInfo = {
    isMerge: false,
    blockMerge: false,
    adjustLine: false,
  }

  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var evt              = context.evt;
  var rep              = context.rep;
  var isMergeKey       = evt.type === "keydown" && (evt.keyCode === BACKSPACE || evt.keyCode === DELETE);

  // if text is selected, we simply ignore, as it is not a merge event
  if (isMergeKey && !textSelected(editorInfo)) {
    // HACK: we need to get current position after calling synchronizeEditorWithUserSelection(), otherwise
    // some tests might fail
    var currentLine   = rep.selStart[0];
    var nextLine      = currentLine + 1;
    var previousLine  = currentLine - 1;
    var caretPosition = getCaretPosition(currentLine, rep, editorInfo, attributeManager);

    if (evt.keyCode === BACKSPACE) {
      var currentLineIsEmpty = lineIsEmpty(currentLine, rep, attributeManager);
      var currentLineHasDifferentTypeOfPreviousLine = thisLineTypeIsDifferentFromPreviousLine(currentLine, attributeManager);

      mergeEventInfo.isMerge = caretPosition.beginningOfLine;

      if (caretPosition.beginningOfLine && !currentLineIsEmpty && currentLineHasDifferentTypeOfPreviousLine) {
        // we only block merge if user is not removing previous line
        // (pressing BACKSPACE on a non-empty line when previous line is empty).
        // Otherwise, we allow merge but we'll need to adjust line attribute after merge
        // (see adjustLines() for more detail)
        var previousLineIsEmpty = (previousLine >= 0) && lineIsEmpty(previousLine, rep, attributeManager);
        if (previousLineIsEmpty) {
          mergeEventInfo.adjustLine = {
            // previous line will be removed, need to adjust its type to current line type
            lineToBeChanged: previousLine,
            changeLineTo: attributeManager.getAttributeOnLine(currentLine, "script_element")
          };
        } else {
          mergeEventInfo.blockMerge = true;
        }
      }
    }
    // WARNING: automated tests are not able to simulate DELETE key, so be extra careful when changing
    // this section of the code:
    else if (evt.keyCode === DELETE) {
      var nextLineIsEmpty = lineIsEmpty(nextLine, rep, attributeManager);
      var currentLineHasDifferentTypeOfNextLine = thisLineTypeIsDifferentFromPreviousLine(nextLine, attributeManager);

      mergeEventInfo.isMerge = caretPosition.endOfLine;

      if (caretPosition.endOfLine && !nextLineIsEmpty && currentLineHasDifferentTypeOfNextLine) {
        // we only block merge if user is not removing current line
        // (pressing DELETE on a empty line when next line is not empty).
        // Otherwise, we allow merge but we'll need to adjust line attribute after merge
        // (see adjustLines() for more detail)
        var currentLineIsEmpty = lineIsEmpty(currentLine, rep, attributeManager);
        if (currentLineIsEmpty) {
          mergeEventInfo.adjustLine = {
            // current line will be removed, need to adjust its type to next line type
            lineToBeChanged: currentLine,
            changeLineTo: attributeManager.getAttributeOnLine(nextLine, "script_element")
          };
        } else {
          mergeEventInfo.blockMerge = true;
        }
      }
    }
  }

  return mergeEventInfo;
}

exports.makeLineAdjustment = function(mergeEventInfo, context) {
  var attributeManager = context.documentAttributeManager;
  var changeLineTo     = mergeEventInfo.adjustLine.changeLineTo;
  var lineToBeChanged  = mergeEventInfo.adjustLine.lineToBeChanged;

  if (changeLineTo) {
    attributeManager.setAttributeOnLine(lineToBeChanged, 'script_element', changeLineTo);
  } else {
    attributeManager.removeAttributeOnLine(lineToBeChanged, 'script_element');
  }
}

var textSelected = function(editorInfo) {
  // HACK: we need to force editor to sync with user selection before testing if there
  // is some text selected
  synchronizeEditorWithUserSelection(editorInfo);

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