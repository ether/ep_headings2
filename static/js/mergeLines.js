var sceneMarkUtils = require("ep_script_scene_marks/static/js/utils");
var sceneMark      = require("ep_script_scene_marks/static/js/handleMultiLineDeletion");
var utils          = require("./utils");
var removeLines    = require("./removeLines");
var _              = require('ep_etherpad-lite/static/js/underscore');

var BACKSPACE = 8;
var DELETE = 46;

exports.findHandlerFor = function(context) {
  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var evt              = context.evt;
  var rep              = context.rep;

  // check key pressed before anything else to be more efficient
  var isMergeKey = (evt.keyCode === BACKSPACE || evt.keyCode === DELETE) && evt.type === "keydown";

  // when user presses a mergeKey we can have three scenarios: no selection at all,
  // selection in only one line(this case is handled by default), selection in more than one line
  if(isMergeKey){
    // if there is no selection at all
    if (!textSelected(editorInfo)) {
      // HACK: we need to get current position after calling synchronizeEditorWithUserSelection(), otherwise
      // some tests might fail
      var currentLine   = rep.selStart[0];
      var caretPosition = getCaretPosition(currentLine, rep, editorInfo, attributeManager);

      var atFirstLineOfPad = currentLineIsFirstLineOfPad(rep);
      var atLastLineOfPad  = currentLineIsLastLineOfPad(rep);

      if (evt.keyCode === BACKSPACE && caretPosition.beginningOfLine && !atFirstLineOfPad) {
        return handleBackspace(context);
      } else if (evt.keyCode === DELETE && caretPosition.endOfLine && !atLastLineOfPad) {
        return handleDelete(context);
      }

    }else if(isMultiLineSelected(rep)){
      return processTextSelected(context);
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

  var previousLineisASceneMark = sceneMarkUtils.lineNumberContainsSceneMark(previousLine);

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
    var currentLineIsEmpty  = lineIsEmpty(currentLine, rep, attributeManager);
    var nextLineIsEmpty     = lineIsEmpty(nextLine, rep, attributeManager);
    var nextLineIsSceneMark = sceneMarkUtils.lineNumberContainsSceneMark(nextLine);

    // Scenarios that allow different line types to be merged:
    // 1. if user is deleting next line (by pressing DELETE at a line where next line is empty and it is not a SM);
    // 2. if user is deleting current line (by pressing DELETE at an empty line where next line is not empty);
    // In any of those scenarios, we manually process the deletion event, and on both we need to prepare
    // line attributes for the UNDO operation -- otherwise, if user performs UNDO, we will loose
    // line types
    var deletingNextLine    = nextLineIsEmpty && !nextLineIsSceneMark;
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

var processTextSelected = function(context){
  // For deletion of selection of multiple lines, where the first line of selection is a script element we have the cases:
  //
  //  1. Beginning of selection is a heading with SM
  //   (we remove the heading and the SM, update the selection target excluding this part removed, and let the rest
  //   to be processed with some rule below
  //
  //  2. Beginning completely selected and end partially selected
  //   (it needs to remove the selection and reapply attribute in the last line selected)
  //
  //  3. Beginning and end of selection partially selected and it is different elements
  //   (it needs to remove the selection, create a new line, and reapply attribute in the last line selected)
  //
  //  4. End of selection is completely selected
  //  5. Beginning and end of selection partially selected and it is the same element
  //   (it only needs to remove the selection)
  //
  //  6. Beginning of selection is a script element end of selection is a scene mark
  //   (goes backwards - clean the scene marks at the end, remove the script elements from the scene mark until the
  //   beginning of the selection)
  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var rep              = context.rep;

  var beginningOfSelectionPosition = rep.selStart;
  var firstLineSelected = rep.selStart[0];
  var endOfSelectionPosition = rep.selEnd;
  var lastLineSelected = rep.selEnd[0];
  var lineToSetAttributes = firstLineSelected;
  var shouldCreateNewLine = false;
  var shouldRecoverAttribsOfLastLineSelected = true;

  var firstLineIsAHeadingWithSMCompletelySelected = isFirstLineSeletedAHeadingWithSM(attributeManager, rep);
  if(firstLineIsAHeadingWithSMCompletelySelected){
    // remove the heading and SM
    var firstSMOfSceneSelected = sceneMark.getFirstSceneMarkOfScene(firstLineSelected, rep);
    var endOfHeadingSelected = [firstLineSelected, getLength(firstLineSelected, rep)];
    removeLinesCompletely(firstSMOfSceneSelected, endOfHeadingSelected[0], editorInfo, rep);

    // as we removed part of selection, we update the values of start and end of selection
    beginningOfSelectionPosition = rep.selStart;
    endOfSelectionPosition = rep.selEnd;

    lineToSetAttributes = firstSMOfSceneSelected;

    // avoid merging with the previous line, except when it is the first line of the pad
    if(lineToSetAttributes > 0){
      shouldCreateNewLine = true;
    }
  }
  var endOfSelectionIsSceneMark = getSceneMarkTypeOfLine(lastLineSelected, attributeManager);
  if(endOfSelectionIsSceneMark){
    // when the selection begins in a script element and ends in a scene mark we remove in two steps:
    // 1. clean the last scene marks selected
    // 2. remove everything (SE, SM) before the this scene mark cleaned

    // clean the scene mark
    var beginningOfLastSceneMarkOfSelection = sceneMark.getFirstSceneMarkOfScene(lastLineSelected, rep);
    sceneMark.cleanLinesSceneMark(beginningOfLastSceneMarkOfSelection, lastLineSelected, context);

    shouldRecoverAttribsOfLastLineSelected = false;

    // the part to be removed will end in the previous line of the beginning of scene mark cleaned
    var prevLineOfStartOfLastSMOfSelection =  beginningOfLastSceneMarkOfSelection - 1;
    var lengthOfprevLineOfStartOfLastSMOfSelection = getLength(prevLineOfStartOfLastSMOfSelection, rep);
    endOfSelectionPosition = [prevLineOfStartOfLastSMOfSelection, lengthOfprevLineOfStartOfLastSMOfSelection];

  // end of selection is a script element
  }else{
    var endOfSelectionIsHeadingWithSceneMark = isLineAHeadingWithSceneMark(lastLineSelected, attributeManager);
    var boundariesOfSelectionHasSameType = checkIfLinesIsTheSameScriptElement(firstLineSelected, lastLineSelected, attributeManager);
    if(endOfSelectionIsHeadingWithSceneMark){
      // removes part of the heading
      var beginningOfHeadingSelected = [lastLineSelected, 1];
      removeLines.removeAndProcessSelection(context, beginningOfHeadingSelected, endOfSelectionPosition, false, false, false);

      // clean the scene marks
      var beginningOfLastSceneMarkOfSelection = sceneMark.getFirstSceneMarkOfScene(lastLineSelected, rep);
      var lastLineOfLastSceneMark = lastLineSelected - 1
      sceneMark.cleanLinesSceneMark(beginningOfLastSceneMarkOfSelection, lastLineOfLastSceneMark, context);

      // the new part to be processed will end in the previous line of the beginning of scene mark cleaned
      var prevLineOfStartOfLastSMOfSelection = beginningOfLastSceneMarkOfSelection - 1;
      endOfSelectionPosition = [prevLineOfStartOfLastSMOfSelection, getLength(prevLineOfStartOfLastSMOfSelection, rep)];

      shouldRecoverAttribsOfLastLineSelected = false;
    // when the boundaries of selection has different types we prevent of merge the lines
    }else if(isBothLinesBoundariesOfSelectionPartiallySelected(context) && !boundariesOfSelectionHasSameType){
      // to avoid merging the rest of content not selected in the lines selected, we remove the selection
      // create a new line after the first line selected, with the rest of the content not selected in the
      // last line of selection
      shouldCreateNewLine = true;

      // we set the attributes that was previously in the last of selection, in the new line created
      var nextLineAfterFirstLineSelected = firstLineSelected + 1;
      lineToSetAttributes = nextLineAfterFirstLineSelected;

    }else if(isLastLineIsCompletelySelected(context)){
      // all the line is removed, so we don't need to reapply any attribute
      shouldRecoverAttribsOfLastLineSelected = false;
    }
  }
  removeLines.removeAndProcessSelection(context, beginningOfSelectionPosition, endOfSelectionPosition, shouldCreateNewLine, lineToSetAttributes, shouldRecoverAttribsOfLastLineSelected);
  placeCaretOnLine(editorInfo, beginningOfSelectionPosition);
  return true;
}

var isFirstLineSeletedAHeadingWithSM = function(attributeManager, rep){
  var firstLineSelected = rep.selStart[0];
  var lineIsAHeadingWithSceneMark = isLineAHeadingWithSceneMark(firstLineSelected, attributeManager)
  selectionStartInBeginningOfLine =  rep.selStart[1] === 1;

  return lineIsAHeadingWithSceneMark && selectionStartInBeginningOfLine;
}

var removeLinesCompletely = function(lineStart, lineEnd, editorInfo, rep){
  var lineLegthOfPad = rep.lines.length();
  var start = [0,0];
  var end = [lineEnd, getLength(lineEnd, rep)];

  if (lineStart > 0){
    var lineBefore = lineStart - 1;
    var lengthOfLineBefore = getLength(lineBefore, rep);
    start = [lineBefore, lengthOfLineBefore];
  }

  // we do it to avoid creating an additional line when the selection wraps
  // the first line of the pad
  if(lineStart === 0 && lineEnd < lineLegthOfPad){
    var nextLineAfterLineEnd = lineEnd + 1;
    end = [nextLineAfterLineEnd, 0];
  }

  editorInfo.ace_performDocumentReplaceRange(start, end, '');
}

var isLineAHeadingWithSceneMark = function(line, attributeManager){
  var previousLine = line - 1;
  var headingHasSceneMark = false;
  var lineAttrib = getScriptElementOfLine(line, attributeManager);

  // avoid getting attrib of line -1
  if(previousLine > 0){
    var previousLineAttrib = getSceneMarkTypeOfLine(previousLine, attributeManager);
    var headingHasSceneMark = previousLineAttrib === "sequence_summary"
  }

  return lineAttrib === "heading" && headingHasSceneMark;
}

var getSceneMarkTypeOfLine = function(line, attributeManager){
  var isAct      = attributeManager.getAttributeOnLine(line, 'act_scene_mark');
  var isSequence = attributeManager.getAttributeOnLine(line, 'sequence_scene_mark');

  return isAct || isSequence;
}

var checkIfLinesIsTheSameScriptElement = function(firstLine, lastLine, attributeManager){
  var firstLineSelection = getScriptElementOfLine(firstLine, attributeManager);
  var lastLineSelection = getScriptElementOfLine(lastLine, attributeManager);

  return firstLineSelection === lastLineSelection;
}

var getScriptElementOfLine = function(line, attributeManager){
  var scriptElement = attributeManager.getAttributeOnLine(line, 'script_element');
  return scriptElement;
}

var isMultiLineSelected = function(rep){
  return rep.selStart[0] !== rep.selEnd[0];
}

var isLastLineIsCompletelySelected = function(context){
  return !isLastLinePartiallySelected(context);
}

var isBothLinesBoundariesOfSelectionPartiallySelected = function(context){
  return isFirstLinePartiallySelected(context) && isLastLinePartiallySelected(context);
}

var isLastLinePartiallySelected = function(context){
  var rep = context.rep;
  var lastLineNumber = rep.selEnd[0];
  var lastLineLength = getLength(lastLineNumber, rep);
  var lastLineIsPartiallySelected = lastLineLength > rep.selEnd[1];
  return lastLineIsPartiallySelected;
}

var isFirstLinePartiallySelected = function(context){
  var rep = context.rep;
  var attributeManager = context.documentAttributeManager;

  var firstLineOfSelection = rep.selStart[0];
  var lineHasMarker = attributeManager.lineHasMarker(firstLineOfSelection);
  var firstPostionOfLine = lineHasMarker ? 1 : 0;
  var firstLineIsPartiallySelected =  rep.selStart[1] > firstPostionOfLine;
  return firstLineIsPartiallySelected;
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

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretAfterRemoveSelection", function(){
    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}