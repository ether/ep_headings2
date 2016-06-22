var sceneMarkUtils = require("ep_script_scene_marks/static/js/utils");
var utils          = require("./utils");

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

    // if there is a selection of more than one line
    }else if(isMultiLineSelected(rep)){
      // For deletion of selection of multiple lines we have the cases:
      //
      //  * beginning completely selected and end partially selected
      //   (it needs to remove the selection and reapply attribute in the last line selected)
      //
      //  * beginning and end of selection partially selected
      //   (it needs to remove the selection, create a new line, and reapply attribute in the last line selected)
      //
      //  * end of selection is completely selected
      //   (it only need to remove the selection)

      var beginningOfSelection = rep.selStart[0];
      var lineToSetAttributes = beginningOfSelection;
      var shouldCreateNewLine = false;
      var shouldRecoverAttribsOfLastLineSelected = true;
      if(isBothLinesBoundariesOfSelectionPartiallySelected(context)){
        // to avoid merging the rest of content not selected in the lines selected, we remove the selection
        // create a new line after the first line selected, with the rest of the content not selected in the
        // last line of selection
        shouldCreateNewLine = true;

        // we set the attributes that was previously in the last of selection, in the new line created
        var nextLineAfterFirstLineSelected = beginningOfSelection + 1;
        lineToSetAttributes = nextLineAfterFirstLineSelected;

      }else if(isLastLineIsCompletelySelected(context)){
        // all the line is removed, so we don't need to reapply any attribute
        shouldRecoverAttribsOfLastLineSelected = false;
      }
      return removeAndProcessSelection(context, shouldCreateNewLine, lineToSetAttributes, shouldRecoverAttribsOfLastLineSelected);
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

var removeAndProcessSelection = function(context, shouldCreateNewLine, lineToSetAttributes, shouldRecoverAttribsOfLastLineSelected){

  var rep = context.rep;
  var editorInfo = context.editorInfo;
  var attributeManager = context.documentAttributeManager;

  var beginningOfSelection = rep.selStart;
  var endOfSelection = rep.selEnd;
  var lastLineSelected = rep.selEnd[0];
  var lastLineAttribs = getAttributesOfLine(lastLineSelected, attributeManager);

  removeSelection(beginningOfSelection, endOfSelection, editorInfo);

  if(shouldCreateNewLine){
    createANewLine(editorInfo)
  }
  if(shouldRecoverAttribsOfLastLineSelected){
    setAttributesOnLine(lastLineAttribs, lineToSetAttributes, attributeManager, editorInfo);
  }
  return true;
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

var createANewLine = function(editorInfo){
  return editorInfo.ace_doReturnKey();
}

var removeSelection = function(beginningOfSelection, endOfSelection, editorInfo){
  editorInfo.ace_performDocumentReplaceRange(beginningOfSelection, endOfSelection, '');
}

var getAttributesOfLine = function(line, attributeManager){
  var allLineAttribsOfLine = attributeManager.getAttributesOnLine(line);
  var lineAttribsOfLine = _.reject(allLineAttribsOfLine, function(attrib) {
    var attribName = attrib[0];
    var isDefaultAttrib = utils.DEFAULT_LINE_ATTRIBS.indexOf(attribName) !== -1;
    return isDefaultAttrib;
  });

  return lineAttribsOfLine;
}

var setAttributesOnLine = function(attribs, line, attributeManager){
  attributeManager.removeAttributeOnLine(line, 'script_element');
  attribs.forEach(function(attrib) {
    var attribName = attrib[0];
    var attribValue = attrib[1];
    attributeManager.setAttributeOnLine(line, attribName, attribValue);
  });
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

var getLength = function(line, rep) {
  var nextLine = line + 1;
  var startLineOffset = rep.lines.offsetOfIndex(line);
  var endLineOffset   = rep.lines.offsetOfIndex(nextLine);

  //lineLength without \n
  var lineLength = endLineOffset - startLineOffset - 1;

  return lineLength;
}