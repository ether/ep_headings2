var utils = require('./utils');

var DRAG_START_TAG = 'dragstart';
var DRAG_END_TAG   = 'dragend';
exports.DRAG_START_TAG = DRAG_START_TAG;
exports.DRAG_END_TAG   = DRAG_END_TAG;

// variables that need to be calculated when DnD is finished, but that can be checked later,
// even after changing the DOM structure
var droppedAtBeginningOfNonGeneral,
    droppedAtEmptyLine,
    droppedAtEndOfGeneral,
    droppedAtBeginningOfGeneral;

exports.init = function() {
  var lastTargetLine, textOfLastTargetLine;

  var $editor = utils.getPadInner().find('#innerdocbody');
  $editor.on('dragover', 'div', function(e) {
    lastTargetLine = e.currentTarget;
    textOfLastTargetLine = $(lastTargetLine).text();
  }).on('dragend', function(e) {
    droppedAtBeginningOfNonGeneral = checkIfDroppedContentAtBeginningOfNonGeneral(lastTargetLine);
    droppedAtEmptyLine             = textOfLastTargetLine.length === 0;
    droppedAtEndOfGeneral          = checkIfDroppedContentAtEndOfGeneral(lastTargetLine, textOfLastTargetLine);
    droppedAtBeginningOfGeneral    = checkIfDroppedContentAtBeginningOfGeneral(lastTargetLine, textOfLastTargetLine);
  });
}

exports.droppedContentAtBeginningOfNonGeneral = function() {
  return droppedAtBeginningOfNonGeneral;
}
exports.droppedContentAtEmptyLine = function() {
  return droppedAtEmptyLine;
}
exports.droppedContentAtEndOfGeneral = function() {
  return droppedAtEndOfGeneral;
}
exports.droppedContentAtBeginningOfGeneral = function() {
  return droppedAtBeginningOfGeneral;
}

var checkIfDroppedContentAtBeginningOfNonGeneral = function(lastTargetLine) {
  // dropped lines are placed inside of <div> (lastTargetLine)
  var $tagsBeforeDroppedContent = $(lastTargetLine).find(DRAG_START_TAG).prev();
  var contentDroppedAtBeginningOfLine = $tagsBeforeDroppedContent.length === 0;

  return contentDroppedAtBeginningOfLine;
}

var checkIfDroppedContentAtEndOfGeneral = function(lastTargetLine, textOfLastTargetLine) {
  return checkIfDroppedContentAtEdgeOfLineWithGeneral(lastTargetLine, textOfLastTargetLine, getLineBeforeDroppedContent());
}
var checkIfDroppedContentAtBeginningOfGeneral = function(lastTargetLine, textOfLastTargetLine) {
  return checkIfDroppedContentAtEdgeOfLineWithGeneral(lastTargetLine, textOfLastTargetLine, getLineAfterDroppedContent());
}
var checkIfDroppedContentAtEdgeOfLineWithGeneral = function(lastTargetLine, textOfLastTargetLine, $neighborLineOfDroppedContent) {
  var targetWasNotSplit = $(lastTargetLine).text() === textOfLastTargetLine;
  var droppedAtEdgeOfLine = $neighborLineOfDroppedContent.get(0) === lastTargetLine;

  return targetWasNotSplit && droppedAtEdgeOfLine;
}

// Because generals don't have a tag on the DOM, dropped lines are placed outside of any
// pre-existing <div>, so they are direct children of <body>
var getLineBeforeDroppedContent = function() {
  var $beginningOfDroppedContent = utils.getPadInner().find(DRAG_START_TAG);
  var $targetLine = $beginningOfDroppedContent.prev();
  return $targetLine;
}
var getLineAfterDroppedContent = function() {
  var $endOfDroppedContent = utils.getPadInner().find(DRAG_END_TAG);
  var $targetLine = $endOfDroppedContent.next();
  return $targetLine;
}
