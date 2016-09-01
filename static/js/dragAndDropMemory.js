var utils = require('./utils');

var DRAG_START_TAG = 'dragstart';
var DRAG_END_TAG   = 'dragend';
exports.DRAG_START_TAG = DRAG_START_TAG;
exports.DRAG_END_TAG   = DRAG_END_TAG;

var contentWasDroppedAtEndOfGeneral, contentWasDroppedAtBeginningOfGeneral;

exports.init = function() {
  var lastTargetLine, textOfLastTargetLine;

  var $editor = utils.getPadInner().find('#innerdocbody');
  $editor.on('dragover', 'div', function(e) {
    lastTargetLine = e.currentTarget;
    textOfLastTargetLine = $(lastTargetLine).text();
  }).on('dragend', function(e) {
    contentWasDroppedAtEndOfGeneral = checkIfDroppedContentAtEndOfGeneral(lastTargetLine, textOfLastTargetLine);
    contentWasDroppedAtBeginningOfGeneral = checkIfDroppedContentAtBeginningOfGeneral(lastTargetLine, textOfLastTargetLine);
  });
}

exports.droppedContentAtEndOfGeneral = function() {
  return contentWasDroppedAtEndOfGeneral;
}
exports.droppedContentAtBeginningOfGeneral = function() {
  return contentWasDroppedAtBeginningOfGeneral;
}

var checkIfDroppedContentAtEndOfGeneral = function(lastTargetLine, textOfLastTargetLine) {
  var $beginningOfDroppedContent = utils.getPadInner().find(DRAG_START_TAG);
  var $lineAboveDroppedContent = $beginningOfDroppedContent.prev();

  var targetWasNotSplit = $(lastTargetLine).text() === textOfLastTargetLine;
  var droppedAtEndOfLine = $lineAboveDroppedContent.get(0) === lastTargetLine;

  return targetWasNotSplit && droppedAtEndOfLine;
}
var checkIfDroppedContentAtBeginningOfGeneral = function(lastTargetLine, textOfLastTargetLine) {
  var $endOfDroppedContent = utils.getPadInner().find(DRAG_END_TAG);
  var $lineBelowDroppedContent = $endOfDroppedContent.next();

  var targetWasNotSplit = $(lastTargetLine).text() === textOfLastTargetLine;
  var droppedAtBeginningOfLine = $lineBelowDroppedContent.get(0) === lastTargetLine;

  return targetWasNotSplit && droppedAtBeginningOfLine;
}
