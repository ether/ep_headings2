var _ = require('ep_etherpad-lite/static/js/underscore');
var FIRST_LINE     = 0;
var tags           = require('ep_script_elements/static/js/shared').tags;
var utils          = require('./utils');
var undoPagination = require('./undoPagination');
var api            = require('./api');

exports.init = function(ace){
  updateElementTypeOnChangeOnDropdown(ace);
  updateDropdownWhenPadLoads(ace)
}

var updateElementTypeOnChangeOnDropdown = function(ace) {
  var script_element_selection = $('#script_element-selection');
  script_element_selection.on('change', function() {
    var value = $(this).val();
    var intValue = parseInt(value,10);
    var selectedOption = $(this).find("option:selected");
    var l10nLabel = selectedOption.attr("data-l10n-id");
    if(!_.isNaN(intValue)) {
      ace.callWithAce(function(ace) {
        ace.ace_doInsertScriptElement(intValue);
        ace.ace_updateDropdownWithValueChosen();
      }, utils.CHANGE_ELEMENT_EVENT, true);
      script_element_selection.val("dummy");
    }
  });
}

// Find out which lines are selected and assign them the script element attribute.
// Passing a level >= 0 will set a script element on the selected lines, level < 0
// will remove it
var doInsertScriptElement = function(level) {
  var rep = this.rep;
  var attributeManager = this.documentAttributeManager;
  var newValue = tags[level];

  // if there's no text selected or type is unknown
  if (!(rep.selStart && rep.selEnd) || (level >= 0 && newValue === undefined)) return;

  var firstLine = rep.selStart[0];
  var lastLine = getLastLine(firstLine, rep);
  var isRemovingAttribute = (level < 0);

  var action = isRemovingAttribute ? removeAttribute : addAttributeIfElementIsNotSM;
  _(_.range(firstLine, lastLine + 1)).each(function(lineNumber) {
    action(lineNumber, attributeManager, newValue);

    // Bug fix: when user changes element to general and then undoes this change, the UNDO might
    // not work properly if line has a page break. So we need to make an adjustment to avoid that
    undoPagination.fix(lineNumber, isRemovingAttribute, attributeManager);

    // if line is split between pages, we need to replicate the change to its other half
    if (lineIsFirstHalfOfSliptLine(lineNumber, attributeManager)) {
      action(lineNumber+1, attributeManager, newValue);
    } else if (lineIsSecondHalfOfSliptLine(lineNumber, attributeManager)) {
      action(lineNumber-1, attributeManager, newValue);
    }
  });
}
exports.doInsertScriptElement = doInsertScriptElement;

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

var lineIsFirstHalfOfSliptLine = function(lineNumber, attributeManager) {
  return attributeManager.getAttributeOnLine(lineNumber, "splitFirstHalf");
}

var lineIsSecondHalfOfSliptLine = function(lineNumber, attributeManager) {
  return attributeManager.getAttributeOnLine(lineNumber, "splitSecondHalf");
}

var updateDropdownWhenPadLoads = function(ace){
  ace.callWithAce(function(ace) {
    // as when we load the pad the SMs is hidden we place the caret at the first SE
    placeCaretOnTheFirstScriptElement(ace);
    ace.ace_updateDropdownWithValueChosen();
  });
}

var placeCaretOnTheFirstScriptElement = function(ace) {
  var rep = ace.ace_getRep();
  var $lineOfFirstScriptElement = getFirstScriptElementOfText();
  var lineOfFirstScriptElement = utils.getLineNumberFromDOMLine($lineOfFirstScriptElement, rep);
  var line = rep.lines.atIndex(lineOfFirstScriptElement);
  var firstCharLinePosition = lineHasMarker(line) ? 1 : 0;
  var firstPositionOfLine = [lineOfFirstScriptElement, firstCharLinePosition];
  placeCaretOnLine(ace, firstPositionOfLine);
}

var getFirstScriptElementOfText = function() {
  var $firstLine = utils.getPadInner().find('div').first();
  var $firstScriptElementOfScript = $firstLine;
  var firstLineIsScriptElement = utils.lineIsScriptElement(FIRST_LINE);
  if(!firstLineIsScriptElement){
    $firstScriptElementOfScript = $firstLine.nextUntil(':not(.sceneMark)').last().next();
  }
  return $firstScriptElementOfScript;
}

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretAfterRemoveSelection", function(){
    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}

var updateDropdownWithValueChosen = function() {
  updateDropdownToCaretLine(this);
  setFocusOnEditor();
}
exports.updateDropdownWithValueChosen = updateDropdownWithValueChosen;

var setFocusOnEditor = function(){
  utils.getPadInner().find("#innerdocbody").focus();
}

exports.sendMessageCaretElementChanged = function (context) {
  var rep              = context.rep;
  var attributeManager = context.documentAttributeManager;
  var multipleLinesSelected  = utils.isMultipleLineSelected();
  var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);
  var elementOfCurrentLine;
  var currentLine = rep.selStart[0];
  var isLineScriptElement = utils.lineIsScriptElement(currentLine);
  if (sameElementOnSelection && isLineScriptElement) {
    elementOfCurrentLine = utils.getLineType(currentLine, attributeManager) || 'general';
  }
  api.triggerCaretElementChanged(elementOfCurrentLine);
}

var updateDropdownToCaretLine = function(context) {
  setTimeout(function() {
    var rep              = context.rep;
    var attributeManager = context.documentAttributeManager;

    var multipleLinesSelected  = utils.isMultipleLineSelected();
    var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);

    var lineNumber  = rep.selStart[0];
    var isLineScriptElement = utils.lineIsScriptElement(lineNumber);
    if (multipleLinesSelected && !sameElementOnSelection || !isLineScriptElement) {
      //set drop-down to "Style"
      setDropdownValue(-2);
    }else{
      var currentLine = rep.selStart[0];
      var elementOfCurrentLine = utils.getLineType(currentLine, attributeManager) || 'general';
      setDropdownToElement(elementOfCurrentLine);
    }
  }, 100);
}
exports.updateDropdownToCaretLine = updateDropdownToCaretLine;

var isSameElementOnSelection = function(rep, attributeManager) {
  var firstLine = rep.selStart[0];
  var isSameElement = true;
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  //get the first attribute on the selection
  var firstAttribute = utils.getLineType(firstLine, attributeManager);
  //check if the first attribute on selection is present in all lines
  _(_.range(firstLine + 1, lastLine + 1)).each(function(line) {
    var attributeOnline = utils.getLineType(line, attributeManager);
    if (attributeOnline !== firstAttribute) {
      isSameElement = false;
      return;
    }
  });
  return isSameElement;
}

var setDropdownToElement = function(attr) {
  var newValue = tags.indexOf(attr);
  setDropdownValue(newValue);
}

var setDropdownValue = function(newValue) {
  // only change value if necessary
  if ($("#script_element-selection").val() === newValue) return;

  // change value and trigger event
  // (we need to manually trigger an event because val() does not trigger the "change" event)
  $("#script_element-selection").val(newValue).trigger("selectElementChange");
}
