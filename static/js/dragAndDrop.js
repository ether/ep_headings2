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
  // the line it was dropped at, if types are the same.
  // Only do that if dragging multiple lines, otherwise leave dragged content as it it
  if (draggingMultipleLines(draggedHtml)) {
    draggedHtml = markEdgesOfDraggedContent(draggedHtml);
  }

  e.originalEvent.dataTransfer.setData('text/html', draggedHtml);
}

var getHtmlContentOfSelection = function() {
  var range = utils.getPadInner().get(0).getSelection().getRangeAt(0);
  var clonedSelection = range.cloneContents();
  var span = document.createElement('span');
  span.appendChild(clonedSelection);

  return span.outerHTML;
}

var draggingMultipleLines = function(draggedHtml) {
  var $draggedContent = $(draggedHtml);
  return $draggedContent.find('div').length !== 0;
}

var markEdgesOfDraggedContent = function(draggedHtml) {
  return DRAG_START_MARKER + draggedHtml + DRAG_END_MARKER;
}

var mergeEdgesOfDroppedContentIfNecessary = function() {
  var $targetLine = utils.getPadInner().find('div:has(dragstart)');

  if ($targetLine.length === 0) {
    // content was dropped on a general. We have a completely different behavior, so we handle
    // it in a different function
    mergeEdgesOfDroppedContentOnAGeneral();
  } else {
    mergeEdgesOfDroppedContentOnANonGeneral($targetLine);
  }

  // remove markers to avoid adding extra line-breaks on dropped content
  removeMarkersOfDroppedContentEdges();
}

var mergeEdgesOfDroppedContentOnAGeneral = function() {
  var $beginningOfDroppedContent = utils.getPadInner().find(DRAG_START_TAG);
  var $endOfDroppedContent       = utils.getPadInner().find(DRAG_END_TAG);

  var $firstHalfOfOriginalTargetLine  = $beginningOfDroppedContent.prev();
  var $secondHalfOfOriginalTargetLine = $endOfDroppedContent.next();

  var $droppedLines = $beginningOfDroppedContent.nextUntil(DRAG_END_TAG);

  var topOfDroppedContentIsGeneralToo    = utils.typeOf($droppedLines.first()) === 'general';
  var bottomOfDroppedContentIsGeneralToo = utils.typeOf($droppedLines.last()) === 'general';

  // merge edges of dropped lines
  if (topOfDroppedContentIsGeneralToo) {
    $firstHalfOfOriginalTargetLine.append($droppedLines.first());
  }
  if (bottomOfDroppedContentIsGeneralToo) {
    $secondHalfOfOriginalTargetLine.prepend($droppedLines.last());
  }
}

var mergeEdgesOfDroppedContentOnANonGeneral = function($targetLine) {
  var typeOfTargetLine = utils.typeOf($targetLine);
  var $droppedLines = $targetLine.find('div');

  mergeDroppedAndTargetLineIfTheyHaveSameType($droppedLines.first(), typeOfTargetLine);
  mergeDroppedAndTargetLineIfTheyHaveSameType($droppedLines.last(), typeOfTargetLine);
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

var removeMarkersOfDroppedContentEdges = function() {
  utils.getPadInner().find(DRAG_START_TAG).remove();
  utils.getPadInner().find(DRAG_END_TAG).remove();
}
