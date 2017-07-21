var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require('./utils');
var undoPagination = require('./undoPagination');

exports.updateElementOfSelection = function(ace, element) {
  ace.callWithAce(function(ace){
    ace.ace_doInsertScriptElement(element);
  }, utils.CHANGE_ELEMENT_EVENT, true);
}


exports.doInsertScriptElement = function(element) {
  var rep = this.rep;
  var attributeManager = this.documentAttributeManager;

  if (!(rep.selStart && rep.selEnd) || (element === undefined)) {
    return;
  }

  var firstLine = rep.selStart[0];
  var lastLine = getLastLine(firstLine, rep);
  var isRemovingAttribute = element === 'general';

  var action = isRemovingAttribute ? removeAttribute : addAttributeIfElementIsNotSM;
  _(_.range(firstLine, lastLine + 1)).each(function(lineNumber) {
    action(lineNumber, attributeManager, element);

    // Bug fix: when user changes element to general and then undoes this change, the UNDO might
    // not work properly if line has a page break. So we need to make an adjustment to avoid that
    undoPagination.fix(lineNumber, isRemovingAttribute, attributeManager);

    // if line is split between pages, we need to replicate the change to its other half
    if (lineIsFirstHalfOfSliptLine(lineNumber, attributeManager)) {
      action(lineNumber+1, attributeManager, element);
    } else if (lineIsSecondHalfOfSliptLine(lineNumber, attributeManager)) {
      action(lineNumber-1, attributeManager, element);
    }
  });
}

function removeAttribute(lineNumber, attributeManager) {
  attributeManager.removeAttributeOnLine(lineNumber, 'script_element');
}

function addAttributeIfElementIsNotSM(lineNumber, attributeManager, value) {
  // avoid applying SE attrib on SM tags
  var isLineScriptElement = utils.lineIsScriptElement(lineNumber);
  if(isLineScriptElement){
    attributeManager.removeAttributeOnLine(lineNumber, 'script_element');
    attributeManager.setAttributeOnLine(lineNumber, 'script_element', value);
  }
}

var getLastLine = function(firstLine, rep) {
  var lastLineSelected = rep.selEnd[0];

  if (lastLineSelected > firstLine) {
    // Ignore last line if the selected text of it it is empty
    if(lastLineSelectedIsEmpty(rep, lastLineSelected)) {
      lastLineSelected--;
    }
  }
  return lastLineSelected;
}

var lastLineSelectedIsEmpty = function(rep, lastLineSelected) {
  var line = rep.lines.atIndex(lastLineSelected);
  // when we've a line with line attribute, the first char line position
  // in a line is 1 because of the *, otherwise is 0
  var firstCharLinePosition = lineHasMarker(line) ? 1 : 0;
  var lastColumnSelected = rep.selEnd[1];

  return lastColumnSelected === firstCharLinePosition;
}

var lineHasMarker = function(line) {
  return line.lineMarker === 1;
}

var lineIsFirstHalfOfSliptLine = function(lineNumber, attributeManager) {
  return attributeManager.getAttributeOnLine(lineNumber, "splitFirstHalf");
}

var lineIsSecondHalfOfSliptLine = function(lineNumber, attributeManager) {
  return attributeManager.getAttributeOnLine(lineNumber, "splitSecondHalf");
}
