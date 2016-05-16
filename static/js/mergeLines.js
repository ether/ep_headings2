var addSceneMark   = require("ep_script_scene_marks/static/js/addSceneMark");

var BACKSPACE = 8;
var DELETE = 46;

exports.findHandlerFor = function(context) {
  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var evt              = context.evt;
  var rep              = context.rep;

  // check key pressed before anything else to be more efficient
  var isMergeKey = (evt.keyCode === BACKSPACE || evt.keyCode === DELETE) && evt.type === "keydown";

  // if text is selected, we simply ignore, as it is not a merge event
  if (isMergeKey && !textSelected(editorInfo)) {
    // HACK: we need to get current position after calling synchronizeEditorWithUserSelection(), otherwise
    // some tests might fail
    var currentLine   = rep.selStart[0];
    var caretPosition = getCaretPosition(currentLine, rep, editorInfo, attributeManager);

    var atFirstLineOfPad = currentLineIsFirstLineOfPad(rep);
    var atLastLineOfPad  = currentLineIsLastLineOfPad(rep);

    if (evt.keyCode === BACKSPACE && caretPosition.beginningOfLine && !atFirstLineOfPad) {
      return handleBackspace;
    } else if (evt.keyCode === DELETE && caretPosition.endOfLine && !atLastLineOfPad) {
      return handleDelete;
    }
  }
}

var handleBackspace = function(context) {
  var blockBackspace = false;

  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var rep              = context.rep;

  var currentLine  = rep.selStart[0];
  var previousLine = currentLine - 1;

  var currentLineIsEmpty = lineIsEmpty(currentLine, rep, attributeManager);
  var currentLineHasDifferentTypeOfPreviousLine = thisLineTypeIsDifferentFromPreviousLine(currentLine, attributeManager);

  var previousLineisASceneMark = addSceneMark.lineNumberContainsSceneMark(previousLine);

  if (!currentLineIsEmpty && currentLineHasDifferentTypeOfPreviousLine) {
    // we only block merge if user is not removing previous line
    // (pressing BACKSPACE on a non-empty line when previous line is empty).
    // Otherwise, we allow merge but we'll need to adjust line attribute after merge
    // (see adjustLines() for more detail)
    var previousLineIsEmpty = lineIsEmpty(previousLine, rep, attributeManager);

    // when the very previous line is a scene mark, we never merge even if it is empty
    if (previousLineIsEmpty && !previousLineisASceneMark) {
      // previous line will be replaced by current line; make sure we copy type of current line to
      // previous line before performing the deletion
      adjustLineAttributeOfLineToBeKept(previousLine, currentLine, attributeManager);
    } else {
      blockBackspace = true;
      // mergeEventInfo.blockMerge = true;
    }
  }

  return blockBackspace;
}

var handleDelete = function(context) {
  var blockDelete = false;

  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var rep              = context.rep;

  var currentLine = rep.selStart[0];
  var nextLine    = currentLine + 1;

  var currentLineHasDifferentTypeOfNextLine = thisLineTypeIsDifferentFromPreviousLine(nextLine, attributeManager);

  if (currentLineHasDifferentTypeOfNextLine) {
    var currentLineIsEmpty = lineIsEmpty(currentLine, rep, attributeManager);
    var nextLineIsEmpty    = lineIsEmpty(nextLine, rep, attributeManager);

    // Scenarios that allow different line types to be merged:
    // 1. if user is deleting next line (by pressing DELETE at a line where next line is empty);
    // 2. if user is deleting current line (by pressing DELETE at an empty line where next line is not empty);
    // In any of those scenarios, we manually process the deletion event, and on both we need to prepare
    // line attributes for the UNDO operation -- otherwise, if user performs UNDO, we will loose
    // line types
    var deletingNextLine    = nextLineIsEmpty;
    var deletingCurrentLine = !nextLineIsEmpty && currentLineIsEmpty;

    if (deletingNextLine) {
      prepareLineAttributesForUndo(nextLine, attributeManager);
      performDelete(editorInfo);
    } else if (deletingCurrentLine) {
      // current line will be replaced by next line; make sure we copy type of next line to
      // current line before performing the deletion
      adjustLineAttributeOfLineToBeKept(currentLine, nextLine, attributeManager);

      prepareLineAttributesForUndo(nextLine, attributeManager);
      performDelete(editorInfo);
    }

    blockDelete = true;
  }

  return blockDelete;
}

var changeLineAttribute = function(line, lineAttribute, attributeManager) {
  if (lineAttribute) {
    attributeManager.setAttributeOnLine(line, 'script_element', lineAttribute);
  } else {
    attributeManager.removeAttributeOnLine(line, 'script_element');
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

var currentLineIsFirstLineOfPad = function(rep) {
  var currentLine = rep.selStart[0];
  return currentLine === 0;
}

var currentLineIsLastLineOfPad = function(rep) {
  var totalLinesOfPad = rep.lines.length();
  var currentLine = rep.selStart[0] + 1; // 1st line is 0, so we need to increase 1 to the value

  return currentLine === totalLinesOfPad;
}

var prepareLineAttributesForUndo = function(targetLine, attributeManager) {
  // only remove line attribute of target line (to force UNDO to re-add it when UNDO is processed)
  changeLineAttribute(targetLine, null, attributeManager);
}

var adjustLineAttributeOfLineToBeKept = function(lineToBeRemoved, lineToBeKept, attributeManager) {
  var attributeOfLineToBeKept = attributeManager.getAttributeOnLine(lineToBeKept, "script_element");
  changeLineAttribute(lineToBeRemoved, attributeOfLineToBeKept, attributeManager);
}

var performDelete = function(editorInfo) {
  var currentCharPosition = editorInfo.ace_caretDocChar();
  editorInfo.ace_performDocumentReplaceCharRange(currentCharPosition, currentCharPosition+1, '');
}