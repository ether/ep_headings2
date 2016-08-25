var utils = require('./utils');

var DRAG_START_TAG = 'dragstart';
var DRAG_END_TAG = 'dragend';

var DRAG_START_MARKER = '<' + DRAG_START_TAG + '><br></' + DRAG_START_TAG + '>';
var DRAG_END_MARKER = '<' + DRAG_END_TAG + '><br></' + DRAG_END_TAG + '>';

exports.init = function() {
  var $editor = utils.getPadInner().find('#innerdocbody');

  $editor.on('dragstart', function(e) {
    setDataTransferWithSelectionContent(e);
  });
  $editor.on('dragend', function(e) {
    mergeEdgesOfDroppedContentIfNecessary();
  });
}

var setDataTransferWithSelectionContent = function(e) {
  var draggedHtml = getHtmlContentOfSelection();

  // we need to mark dragged content edges, so when it is dropped we can merge them to
  // the line it was dropped at, if types are the same
  var adjustedHtml = markEdgesOfDraggedContent(draggedHtml);

  e.originalEvent.dataTransfer.setData('text/html', adjustedHtml);
}

var getHtmlContentOfSelection = function() {
  var range = utils.getPadInner().get(0).getSelection().getRangeAt(0);
  var clonedSelection = range.cloneContents();
  var span = document.createElement('span');
  span.appendChild(clonedSelection);

  return span.outerHTML;
}

var markEdgesOfDraggedContent = function(draggedHtml) {
  return DRAG_START_MARKER + draggedHtml + DRAG_END_MARKER;
}

var mergeEdgesOfDroppedContentIfNecessary = function() {
  var $targetLine = utils.getPadInner().find('div:has(dragstart)');
  var typeOfTargetLine = utils.typeOf($targetLine);
  var $droppedLines = $targetLine.find('div');

  mergeDroppedAndTargetLineIfTheyHaveSameType($droppedLines.first(), typeOfTargetLine);
  mergeDroppedAndTargetLineIfTheyHaveSameType($droppedLines.last(), typeOfTargetLine);

  // remove markers to avoid adding extra line-breaks on dropped content
  removeMarkersOfDroppedContentEdges($targetLine);
}

var mergeDroppedAndTargetLineIfTheyHaveSameType = function($droppedLine, typeOfTargetLine) {
  var typeOfDroppedLine = utils.typeOf($droppedLine);

  var droppedLineHasSameTypeOfTargetLine = typeOfTargetLine === typeOfDroppedLine;

  if (droppedLineHasSameTypeOfTargetLine) {
    $droppedLine.replaceWith(function() {
      return $('<span></span>').html($(this).contents());
    });
  }
}

var removeMarkersOfDroppedContentEdges = function($targetLine) {
  $targetLine.find(DRAG_START_TAG).remove();
  $targetLine.find(DRAG_END_TAG).remove();
}
