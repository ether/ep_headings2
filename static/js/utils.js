var _                        = require('ep_etherpad-lite/static/js/underscore');
var SCRIPT_ELEMENTS_SELECTOR = require('./shared').tags;
exports.SCENE_MARK_SELECTOR  = require("ep_script_scene_marks/static/js/utils").sceneMarkTags;

var LINE_ELEMENTS_SELECTOR   = _.union(SCRIPT_ELEMENTS_SELECTOR, exports.SCENE_MARK_SELECTOR).join(", ");
var SE_TAGS_AND_GENERAL      = _.union(SCRIPT_ELEMENTS_SELECTOR, ["general"]);
exports.DEFAULT_LINE_ATTRIBS = ['author', 'lmkr', 'insertorder', 'start'];

exports.CHANGE_ELEMENT_EVENT = 'insertscriptelement';
exports.HEADING_ADD_EVENT    = 'headingAdded';

// Easier access to outer pad
var padOuter;
exports.getPadOuter = function() {
 padOuter = padOuter || $('iframe[name="ace_outer"]').contents();
 return padOuter;
}

// Easier access to inner pad
var padInner;
exports.getPadInner = function() {
 padInner = padInner || exports.getPadOuter().find('iframe[name="ace_inner"]').contents();
 return padInner;
}

exports.SCENE_MARK_TYPE = {
  0 : 'withEpi',
  1 : 'withEpi',
  2 : 'withAct',
  3 : 'withAct',
  4 : 'withSeq',
  5 : 'withSeq',
  6 : 'withSceneSynopsis',
  7 : 'withSceneSynopsis',
  8 : 'withHeading',
}

exports.selectionStartsOnAScriptElement = function() {
  var $selectionStart = exports.getFirstLineOfSelection();
  return domLineIsAScriptElement($selectionStart);
}

exports.lineIsScriptElement = function(lineNumber) {
  var $lines = exports.getPadInner().find("div");
  var $line = $lines.eq(lineNumber);
  return domLineIsAScriptElement($line);
}
var domLineIsAScriptElement = function($line) {
  var typeOfLine = typeOf($line);
  return _.contains(SE_TAGS_AND_GENERAL, typeOfLine);
}
exports.domLineIsAScriptElement = domLineIsAScriptElement;

var getLineType = function(targetLine, attributeManager) {
  return attributeManager.getAttributeOnLine(targetLine, 'script_element');
}
exports.getLineType = getLineType;

exports.lineIsHeading = function(targetLine, attributeManager) {
  return getLineType(targetLine, attributeManager) === 'heading';
}

exports.domLineIsAHeading = function($line) {
  return typeOf($line) === 'heading';
}

var typeOf = function($line) {
 var $innerElement = $line.find(LINE_ELEMENTS_SELECTOR);
 var tagName = $innerElement.prop("tagName") || "general"; // general does not have inner tag

 return tagName.toLowerCase();
}
exports.typeOf = typeOf;

exports.isMultipleLineSelected = function() {
  var selectionLines = getLinesOnSelectionEdges();
  return selectionLines.start !== selectionLines.end;
}

exports.getFirstLineOfSelection = function() {
  var selection = getLinesOnSelectionEdges();
  var $firstLineSelected = selection.backward ? $(selection.end) : $(selection.start);

  return $firstLineSelected;
}

var getLinesOnSelectionEdges = function() {
  var selection = exports.getPadInner().get(0).getSelection();
  // it depends on the direction of the selection
  var selectionAnchor = selection.anchorNode;
  var selectionFocus = selection.focusNode;

  var anchorOffset = selection.anchorOffset;
  var focusOffset = selection.focusOffset;


  var anchorLine = getLineNodeFromDOMInnerNode(selectionAnchor, anchorOffset);
  var focusLine = getLineNodeFromDOMInnerNode(selectionFocus, focusOffset);

  // When selection is backwards oriented and wraps different nodes,
  // compareDocumentPosition returns 2
  var selectionDirection = anchorLine.compareDocumentPosition(focusLine);
  var backwardSelection = selectionDirection === 2;

  return {
    start: anchorLine,
    end: focusLine,
    backward: backwardSelection
  };
}

var getLineNodeFromDOMInnerNode = function(originalNode, offsetOnBody) {
  var node = originalNode;

  // bug fix: https://trello.com/c/CmLALxwD/955 and
  // https://trello.com/c/lQaBTlUw/1000
  // Sometimes the browser starts selection on iframe body, in the browser
  // the selection is showed correctly, though. When this happens, we have
  // to set manually in which node the selection begins
  if (node && node.tagName && node.tagName.toLowerCase() === 'body') {
    node = getLineSelectedUsingOffset(node, offsetOnBody);
  }

  // go up on DOM tree until reach iframe body (which is the direct parent of all lines on editor)
  while (node && node.parentNode && !(node.parentNode.tagName && node.parentNode.tagName.toLowerCase() === 'body')) {
    node = node.parentNode;
  }

  return node;
}

// when the selection returns the body as the start node, the offset returns
// which line the selection begins. The only exception of this rule is
// when user deletes a selection that goes until the last line of the pad.
// In this case, the line selected is 'offset - 1'
var getLineSelectedUsingOffset = function (node, offset) {
  var $lines = exports.getPadInner().find('div');
  if (offset > $lines.length - 1) {
    offset = offset - 1;
  }

  return $lines.get(offset);
}

exports.getLineNumberFromDOMLine = function ($line, rep) {
  var lineId     = $line.attr("id");
  var lineNumber = rep.lines.indexOfKey(lineId);

  return lineNumber;
}

exports.getLineNumberOfCaretLine = function(rep) {
  var $firstLine = exports.getFirstLineOfSelection();
  var firstLineNumber = exports.getLineNumberFromDOMLine($firstLine, rep);

  return firstLineNumber;
}
