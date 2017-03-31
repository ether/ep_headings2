var sceneMarkUtils                   = require("ep_script_scene_marks/static/js/utils");
var sceneMarkHandleMultiLineDeletion = require("ep_script_scene_marks/static/js/handleMultiLineDeletion");
var utils                            = require("./utils");
var removeLines                      = require("./removeLines");
var _                                = require('ep_etherpad-lite/static/js/underscore');

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
  if(isMergeKey && utils.selectionStartsOnAScriptElement()){
    // if there is no selection at all
    if (!textSelected(editorInfo)) {
      // HACK: we need to get current position after calling synchronizeEditorWithUserSelection(), otherwise
      // some tests might fail
      var currentLineNumber = utils.getLineNumberOfCaretLine(rep);
      var caretPosition = getCaretPosition(currentLineNumber, rep, editorInfo, attributeManager);

      var atFirstLineOfPad = currentLineIsFirstLineOfPad(rep);
      var atLastLineOfPad  = currentLineIsLastLineOfPad(rep);

      if (evt.keyCode === BACKSPACE && caretPosition.beginningOfLine && !atFirstLineOfPad) {
        return handleBackspace(context);
      } else if (evt.keyCode === DELETE && caretPosition.endOfLine && !atLastLineOfPad) {
        return handleDelete(context);
      }

    }else if(utils.isMultipleLineSelected()){
      return processTextSelected(context);
    }
  }
}

var handleBackspace = function(context) {
  var blockBackspace = false;

  var editorInfo       = context.editorInfo;
  var attributeManager = context.documentAttributeManager;
  var rep              = context.rep;

  var currentLine  = utils.getLineNumberOfCaretLine(rep);
  var previousLine = getPreviousLineWithScriptElement(currentLine, attributeManager);

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

    if (lineToBeDeleted !== null) {
      performDeleteOf(lineToBeDeleted, editorInfo, rep, attributeManager);
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
  var nextLine    = getNextLineWithScriptElement(currentLine, attributeManager);

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
      placeCaretOnBeginningOfLine(nextLine, editorInfo, rep);
    }

    if (lineToBeDeleted !== null) {
      performDeleteOf(lineToBeDeleted, editorInfo, rep, attributeManager);
      linesWillBeMerged(lineToBeDeleted, context);
    }

    blockDelete = true;
  }

  return blockDelete;
}

var getPreviousLineWithScriptElement = function(currentLine, attributeManager) {
  var previousLine = currentLine - 1;

  // skip lines with scene marks
  while (sceneMarkUtils.lineIsSceneMark(previousLine, attributeManager)) previousLine--;

  return previousLine;
}
var getNextLineWithScriptElement = function(currentLine, attributeManager) {
  var nextLine = currentLine + 1;

  // skip lines with scene marks
  while (sceneMarkUtils.lineIsSceneMark(nextLine, attributeManager)) nextLine++;

  return nextLine;
}

var linesWillBeMerged = function(lineToBeMerged, context) {
  // Reflect the element removal on the edit event associated with this change,
  // so that other plugins know that this change happened
  if (context.callstack) {
    context.callstack.editEvent.eventType = 'scriptElementRemoved';
    context.callstack.editEvent.data = { lineNumbers: [lineToBeMerged] };
  }
}

var processTextSelected = function(context){
  // For deletion of selection of multiple lines, where the first line of selection is a script element we have the cases:
  //
  //  [1]. Beginning of selection is a heading completely selected
  //   (we remove the heading and the SM, update the selection target excluding this part removed, and let the rest
  //   to be processed with some rule below
  //
  //  [2]. End of selection is a scene mark
  //   (goes backwards - clean the scene marks at the end, remove the script elements from the scene mark until the
  //   beginning of the selection)
  //
  //  [3]. End of a selection is a heading partially selected - we remove the text of the scene marks partially selected,
  //   remove the part selected of the heading and remove the rest.
  //
  //  [4]. Beginning and end of selection partially selected and it is different elements
  //   (it needs to remove the selection, create a new line, and reapply attribute in the last line selected)
  //
  //  [5]. End of selection is completely selected
  //  (it only needs to remove the selection)
  //
  //  [6]. Beginning completely selected and end partially selected
  //   (it needs to remove the selection and reapply attribute in the last line selected)
  //
  //  [7]. Beginning and end of selection partially selected and it is the same element
  //   (it only needs to remove the selection)
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
  var beginningOfLastSceneMarkOfSelection;
  var prevLineOfStartOfLastSMOfSelection;
  var firstLineIsAHeadingCompletelySelected = isFirstLineSelectedAHeadingCompletelySelected(attributeManager, rep);

  // [1] - if the first line selected is a heading and it is completely selected we have to remove the SM as well
  if(firstLineIsAHeadingCompletelySelected){
    var firstSMOfSceneSelected = sceneMarkUtils.getFirstSceneMarkOfScene(firstLineSelected, rep);
    beginningOfSelectionPosition = [firstSMOfSceneSelected, 0];
    lineToSetAttributes = firstSMOfSceneSelected;
  }

  var endOfSelectionIsSceneMark = sceneMarkUtils.lineIsSceneMark(lastLineSelected, attributeManager);
  if(endOfSelectionIsSceneMark){
    // [2] - when the selection begins in a script element and ends in a scene mark we remove in two steps:
    // 1. clean the last scene marks selected
    // 2. remove everything (SE, SM) before the this scene mark cleaned

    // clean the scene mark
    beginningOfLastSceneMarkOfSelection = sceneMarkUtils.getFirstSceneMarkOfScene(lastLineSelected, rep);
    sceneMarkHandleMultiLineDeletion.cleanLinesSceneMark(beginningOfLastSceneMarkOfSelection, lastLineSelected, context);
    shouldRecoverAttribsOfLastLineSelected = false;

    // the part to be removed will end in the previous line of the beginning of scene mark cleaned
    prevLineOfStartOfLastSMOfSelection =  beginningOfLastSceneMarkOfSelection - 1;
    var lengthOfprevLineOfStartOfLastSMOfSelection = getLength(prevLineOfStartOfLastSMOfSelection, rep);
    endOfSelectionPosition = [prevLineOfStartOfLastSMOfSelection, lengthOfprevLineOfStartOfLastSMOfSelection];

  }else{
    // end of selection is a script element
    var endOfSelectionIsHeading = lineIsHeading(lastLineSelected);
    var boundariesOfSelectionHasSameType = checkIfLinesIsTheSameScriptElement(firstLineSelected, lastLineSelected);
    if(endOfSelectionIsHeading){
      // [3] - removes part of the heading
      var beginningOfHeadingSelected = [lastLineSelected, 1];
      removeLines.removeAndProcessSelection(context, beginningOfHeadingSelected, endOfSelectionPosition, false, false, false);

      // clean the scene marks
      beginningOfLastSceneMarkOfSelection = sceneMarkUtils.getFirstSceneMarkOfScene(lastLineSelected, rep);
      var lastLineOfLastSceneMark = lastLineSelected - 1
      sceneMarkHandleMultiLineDeletion.cleanLinesSceneMark(beginningOfLastSceneMarkOfSelection, lastLineOfLastSceneMark, context);

      // the new part to be processed will end in the previous line of the beginning of scene mark cleaned
      prevLineOfStartOfLastSMOfSelection = beginningOfLastSceneMarkOfSelection - 1;
      endOfSelectionPosition = [prevLineOfStartOfLastSMOfSelection, getLength(prevLineOfStartOfLastSMOfSelection, rep)];
      shouldRecoverAttribsOfLastLineSelected = false;
    }else if(isBothLinesBoundariesOfSelectionPartiallySelected(context) && !boundariesOfSelectionHasSameType){
      // [4] - when the boundaries of selection has different types we prevent of merge the lines
      // to avoid merging the rest of content not selected in the lines selected, we remove the selection
      // create a new line after the first line selected, with the rest of the content not selected in the
      // last line of selection
      shouldCreateNewLine = true;

      // we set the attributes that was previously in the last of selection, in the new line created
      var nextLineAfterFirstLineSelected = firstLineSelected + 1;
      lineToSetAttributes = nextLineAfterFirstLineSelected;

    }else if(isLastLineCompletelySelected(context)){
      // [5] - all the line is removed, so we don't need to reapply any attribute
      shouldRecoverAttribsOfLastLineSelected = false;
    }
  }
  removeLines.removeAndProcessSelection(context, beginningOfSelectionPosition, endOfSelectionPosition, shouldCreateNewLine, lineToSetAttributes, shouldRecoverAttribsOfLastLineSelected);
  placeCaretOnLine(editorInfo, beginningOfSelectionPosition);
  return true;
}
exports.processTextSelected = processTextSelected;

var isFirstLineSelectedAHeadingCompletelySelected = function(attributeManager, rep){
  var firstLineSelected = rep.selStart[0];
  var firstLineSelectedIsHeading = lineIsHeading(firstLineSelected)
  var selectionStartInBeginningOfLine =  rep.selStart[1] === 1;

  return firstLineSelectedIsHeading && selectionStartInBeginningOfLine;
}

var lineIsHeading = function (lineNumber) {
  var $line = utils.getPadInner().find("div").eq(lineNumber);
  var typeOfLine = utils.typeOf($line);
  return typeOfLine === "heading";
}

var checkIfLinesIsTheSameScriptElement = function(firstLine, lastLine){
  var lineIsScriptElement = utils.lineIsScriptElement(firstLine);
  var $firstLine = utils.getPadInner().find("div").eq(firstLine);
  var $lastLine = utils.getPadInner().find("div").eq(lastLine);
  var firstLineType = utils.typeOf($firstLine);
  var lastLineType = utils.typeOf($lastLine);

  return lineIsScriptElement && (firstLineType === lastLineType);
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
  var $line = $lines.eq(lineNumber);
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

var performDeleteOf = function(targetLine, editorInfo, rep, attributeManager) {
  if (targetLine > 0) {
    removeContentFromEndOfPreviousLineUntilEndOfTargetLine(targetLine, editorInfo, rep);
  } else {
    // there's no previous line, we need to use a different strategy
    replaceContentOfTargetLineByNextLine(targetLine, editorInfo, rep, attributeManager);
  }
}

var removeContentFromEndOfPreviousLineUntilEndOfTargetLine = function(targetLine, editorInfo, rep) {
  var enfOfLineBeforeTarget = rep.lines.offsetOfIndex(targetLine) - 1;
  var endOfTargetLine       = rep.lines.offsetOfIndex(targetLine + 1) - 1;
  editorInfo.ace_performDocumentReplaceCharRange(enfOfLineBeforeTarget, endOfTargetLine, '');
}
var replaceContentOfTargetLineByNextLine = function(targetLine, editorInfo, rep, attributeManager) {
  // this is necessary for UNDO to work:
  changeLineAttribute(targetLine, null, attributeManager);

  // set line type
  var lineBelowTarget = targetLine + 1;
  var attributeOfLineToBeKept = utils.getLineType(lineBelowTarget, attributeManager);
  changeLineAttribute(targetLine, attributeOfLineToBeKept, attributeManager);

  // replace content
  var endOfTargetLine = rep.lines.offsetOfIndex(lineBelowTarget) - 1;
  editorInfo.ace_performDocumentReplaceCharRange(endOfTargetLine, endOfTargetLine + 1, '');
}

var placeCaretOnBeginningOfLine = function(targetLine, editorInfo, rep) {
  var targetLineEntry = rep.lines.atIndex(targetLine);
  var beginningOfTargetLine = [targetLine, targetLineEntry.lineMarker];

  editorInfo.ace_performSelectionChange(beginningOfTargetLine, beginningOfTargetLine, true);
}

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretAfterRemoveSelection", function(){
    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}
