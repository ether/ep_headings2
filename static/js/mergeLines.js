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
  if(isMergeKey && isCaretStartPositionInAScriptElement(rep)){
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
  var previousLine = getPreviousLineWithScriptElement(currentLine, rep, attributeManager);

  var currentLineHasDifferentTypeOfPreviousLine = thisLineTypeIsDifferentFromPreviousLine(currentLine);

  if (currentLineHasDifferentTypeOfPreviousLine) {
    var currentLineIsEmpty = lineIsEmpty(currentLine, rep, attributeManager);
    var previousLineIsEmpty = lineIsEmpty(previousLine, rep, attributeManager);

    // Scenarios that allow different line types to be merged:
    // 1. if user is deleting current line (by pressing BACKSPACE at an empty line where previous line is not empty);
    // 2. if user is deleting previous line (by pressing BACKSPACE at a non-empty line where previous line is empty);
    // In any of those scenarios, we manually process the deletion event
    var deletingCurrentLine  = currentLineIsEmpty;
    var deletingPreviousLine = !currentLineIsEmpty && previousLineIsEmpty;
    var lineToBeDeleted = deletingCurrentLine ? currentLine : (deletingPreviousLine ? previousLine : null);

    if (lineToBeDeleted) {
      performDeleteOf(lineToBeDeleted, editorInfo, rep);
      linesWillBeMerged(lineToBeDeleted, context);
    }

    blockBackspace = true;
  }

  return blockBackspace;
}

var handleDelete = function(context) {
  var blockDelete = false;

  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var rep              = context.rep;

  var currentLine = rep.selStart[0];
  var nextLine    = getNextLineWithScriptElement(currentLine, rep, attributeManager);

  var currentLineHasDifferentTypeOfNextLine = thisLineTypeIsDifferentFromPreviousLine(nextLine);

  if (currentLineHasDifferentTypeOfNextLine) {
    var currentLineIsEmpty  = lineIsEmpty(currentLine, rep, attributeManager);
    var nextLineIsEmpty     = lineIsEmpty(nextLine, rep, attributeManager);

    // Scenarios that allow different line types to be merged:
    // 1. if user is deleting current line (by pressing DELETE at an empty line where next line is not empty);
    // 2. if user is deleting next line (by pressing DELETE at a non-empty line where next line is empty);
    // In any of those scenarios, we manually process the deletion event
    var deletingCurrentLine = !nextLineIsEmpty && currentLineIsEmpty;
    var deletingNextLine    = nextLineIsEmpty;
    var lineToBeDeleted = deletingCurrentLine ? currentLine : (deletingNextLine ? nextLine : null);

    if (deletingCurrentLine) {
      // make sure caret will be at the right place when deletion is completed
      placeCaretOnBeginningOfNextLine(nextLine, editorInfo, rep);
    }

    if (lineToBeDeleted) {
      performDeleteOf(lineToBeDeleted, editorInfo, rep);
      linesWillBeMerged(lineToBeDeleted, context);
    }

    blockDelete = true;
  }

  return blockDelete;
}

var getPreviousLineWithScriptElement = function(currentLine, rep, attributeManager) {
  var previousLine = currentLine - 1;

  // skip lines with scene marks
  while (sceneMarkUtils.lineIsSceneMark(previousLine, rep, attributeManager)) previousLine--;

  return previousLine;
}
var getNextLineWithScriptElement = function(currentLine, rep, attributeManager) {
  var nextLine = currentLine + 1;

  // skip lines with scene marks
  while (sceneMarkUtils.lineIsSceneMark(nextLine, rep, attributeManager)) nextLine++;

  return nextLine;
}

var linesWillBeMerged = function(lineToBeMerged, context) {
  // Reflect the element removal on the edit event associated with this change,
  // so that other plugins know that this change happened
  if (context.callstack) {
    context.callstack.editEvent.eventType = 'scriptElementRemoved';
    context.callstack.editEvent.data = { lineNumber: lineToBeMerged };
  }
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

  // if the first line selected is a heading with SM we have to remove the SM as well
  if(firstLineIsAHeadingWithSMCompletelySelected){
    var firstSMOfSceneSelected = sceneMark.getFirstSceneMarkOfScene(firstLineSelected, rep);
    var endOfHeadingSelected = [firstLineSelected, getLength(firstLineSelected, rep)];

    beginningOfSelectionPosition = [firstSMOfSceneSelected, 0];
    lineToSetAttributes = firstSMOfSceneSelected;
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

    }else if(isLastLineCompletelySelected(context)){
      // all the line is removed, so we don't need to reapply any attribute
      shouldRecoverAttribsOfLastLineSelected = false;
    }
  }
  removeLines.removeAndProcessSelection(context, beginningOfSelectionPosition, endOfSelectionPosition, shouldCreateNewLine, lineToSetAttributes, shouldRecoverAttribsOfLastLineSelected);
  placeCaretOnLine(editorInfo, beginningOfSelectionPosition);
  return true;
}
exports.processTextSelected = processTextSelected;

var isFirstLineSeletedAHeadingWithSM = function(attributeManager, rep){
  var firstLineSelected = rep.selStart[0];
  var lineIsAHeadingWithSceneMark = isLineAHeadingWithSceneMark(firstLineSelected, attributeManager)
  selectionStartInBeginningOfLine =  rep.selStart[1] === 1;

  return lineIsAHeadingWithSceneMark && selectionStartInBeginningOfLine;
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

var isLastLineCompletelySelected = function(context){
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

var thisLineTypeIsDifferentFromPreviousLine = function(line) {
  var lineBefore = line - 1;
  var $currentLine = getLineFromLineNumber(line);
  var $lineBefore = getLineFromLineNumber(lineBefore);

  var currentLineAttribute = utils.typeOf($currentLine);
  var previousLineAttribute = utils.typeOf($lineBefore);

  return currentLineAttribute !== previousLineAttribute;
}

var getLineFromLineNumber = function(lineNumber){
  var $lines = utils.getPadInner().find("div");
  var $line = $lines.slice(lineNumber, lineNumber + 1);
  return $line;
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

var performDeleteOf = function(targetLine, editorInfo, rep) {
  var enfOfLineBeforeTarget = rep.lines.offsetOfIndex(targetLine) - 1;
  var endOfTargetLine       = rep.lines.offsetOfIndex(targetLine + 1) - 1;
  editorInfo.ace_performDocumentReplaceCharRange(enfOfLineBeforeTarget, endOfTargetLine, '');
}

var placeCaretOnBeginningOfNextLine = function(nextLine, editorInfo, rep) {
  var nextLineEntry = rep.lines.atIndex(nextLine);
  var beginningOfNextLine = [nextLine, nextLineEntry.lineMarker];

  editorInfo.ace_performSelectionChange(beginningOfNextLine, beginningOfNextLine, true);
}

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretAfterRemoveSelection", function(){
    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}

var isCaretStartPositionInAScriptElement = function(rep){
  var firstLineOfSelection = rep.selStart[0];
  var lineIsScriptElement = utils.lineIsScriptElement(firstLineOfSelection);

  return lineIsScriptElement;
}