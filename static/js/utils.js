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
  var selectionLines = getLinesOnSelectionEdges();
  return domLineIsAScriptElement($(selectionLines.start));
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

var getLinesOnSelectionEdges = function() {
  var selection = exports.getPadInner().get(0).getSelection();

  var selectionAnchor = selection.anchorNode;
  var selectionFocus = selection.focusNode;

  var anchorLine = getLineNodeFromDOMInnerNode(selectionAnchor);
  var focusLine = getLineNodeFromDOMInnerNode(selectionFocus);

  return {
    start: anchorLine,
    end: focusLine
  };
}

var getLineNodeFromDOMInnerNode = function(originalNode) {
  var node = originalNode;

  // go up on DOM tree until reach iframe body (which is the direct parent of all lines on editor)
  while (node && node.parentNode && !(node.parentNode.tagName && node.parentNode.tagName.toLowerCase() === 'body')) {
    node = node.parentNode;
  }

  return node;
}

exports.getLineNumberFromDOMLine = function ($line, rep) {
  var lineId     = $line.attr("id");
  var lineNumber = rep.lines.indexOfKey(lineId);

  return lineNumber;
}
