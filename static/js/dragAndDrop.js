var _ = require('ep_etherpad-lite/static/js/underscore');

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

  var $droppedLines = $beginningOfDroppedContent.nextUntil(DRAG_END_TAG);

  var $firstHalfOfOriginalTargetLine = $beginningOfDroppedContent.prev();
  var $secondHalfOfOriginalTargetLine = $endOfDroppedContent.next();

  mergeTopEdgeOfDroppedContentIfItIsAGeneral($droppedLines.first(), $firstHalfOfOriginalTargetLine);
  mergeBottomEdgeOfDroppedContentIfItIsAGeneral($droppedLines.last(), $secondHalfOfOriginalTargetLine);
}

var mergeTopEdgeOfDroppedContentIfItIsAGeneral = function($droppedLine, $targetLine) {
  mergeEdgeOfDroppedContentIfItIsAGeneral($droppedLine, $targetLine, true);
}
var mergeBottomEdgeOfDroppedContentIfItIsAGeneral = function($droppedLine, $targetLine) {
  mergeEdgeOfDroppedContentIfItIsAGeneral($droppedLine, $targetLine, false);
}
var mergeEdgeOfDroppedContentIfItIsAGeneral = function($droppedLine, $targetLine, isTopEdge) {
  var droppedLineIsGeneralToo = utils.typeOf($droppedLine) === 'general';
  if (droppedLineIsGeneralToo) {
    if (isTopEdge) {
      $targetLine.append($droppedLine);
    } else {
      $targetLine.prepend($droppedLine);
    }

    // Bug fix: moving a general into inside a line ('merging it') leads to a <div> inside
    // another <div>, which inserts an extra line break between them. To avoid this, we transform
    // the inner <div> into a <span>
    var $innerDiv = $targetLine.find('div');
    $innerDiv.replaceWith(function() {
      return $('<span></span>').html($(this).contents());
    });
  }
}

var mergeEdgesOfDroppedContentOnANonGeneral = function($targetLine) {
  var typeOfTargetLine = typeOfLineWithDroppedContent($targetLine);

  // Bug fix: when content is dropped at beginning of line, the types of edge lines are
  // being messed up. To avoid that, we need to move dropped content out of $targetLine
  if (contentWasDroppedAtBeginningOfLine($targetLine)) {
    moveDroppedContentOutOfTargetLine($targetLine, typeOfTargetLine);
  }

  var $droppedLines = $targetLine.find('div');
  mergeDroppedAndTargetLineIfTheyHaveSameType($droppedLines.first(), typeOfTargetLine);
  mergeDroppedAndTargetLineIfTheyHaveSameType($droppedLines.last(), typeOfTargetLine);
}

var contentWasDroppedAtBeginningOfLine = function($targetLine) {
  var $tagsBeforeDroppedContent = $targetLine.find(DRAG_START_TAG).prev();
  var contentDroppedAtBeginningOfLine = $tagsBeforeDroppedContent.length === 0;

  return contentDroppedAtBeginningOfLine;
}

var moveDroppedContentOutOfTargetLine = function($targetLine, typeOfTargetLine) {
  var $droppedLines = $targetLine.find('div');
  var typeOfLastDroppedLine = utils.typeOf($droppedLines.last());

  var lastDroppedLineShouldBeMerged = typeOfLastDroppedLine === typeOfTargetLine;
  var $linesToMoveOutOfLine = lastDroppedLineShouldBeMerged ? $droppedLines.slice(0, -1) : $droppedLines;

  // move content out of target line
  $targetLine.before($linesToMoveOutOfLine);
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

// when content is dropped into a line, we have a div inside another, so using utils.typeOf()
// might result in the wrong line type
var typeOfLineWithDroppedContent = function($targetLine) {
  var $innerTags = $targetLine.children().not('div div');
  var innerTagNames = $innerTags.map(function() { return this.tagName.toLowerCase() });

  // include fallback, as general does not have a tag
  innerTagNames.push('general');

  // result of intersection() must always be an array with a single value
  return _.intersection(utils.SE_TAGS_AND_GENERAL, innerTagNames)[0];
}