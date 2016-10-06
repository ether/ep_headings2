var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var scriptElementTransitionUtils = require("ep_script_element_transitions/static/js/utils");

var tags              = require('ep_script_elements/static/js/shared').tags;
var sceneTag          = require('ep_script_elements/static/js/shared').sceneTag;
var utils             = require('./utils');
var SM_AND_HEADING    = _.union(utils.SCENE_MARK_SELECTOR, ['heading']);
var shortcuts         = require('./shortcuts');
var mergeLines        = require('./mergeLines');
var undoPagination    = require('./undoPagination');
var fixSmallZooms     = require('./fixSmallZooms');
var cutEvents         = require('./cutEvents');
var updateHeadingType = require('./updateHeadingType');

var UNDO_REDO_EVENT   = 'undoRedoEvent';
var PASTE_ON_SE_CLASS = 'pasteOnSE';
var FIRST_LINE        = 0;
var ENTER          = 13;
var cssFiles       = ['ep_script_elements/static/css/editor.css'];

// All our tags are block elements, so we just return them.
exports.aceRegisterBlockElements = function() {
  return _.flatten([undoPagination.UNDO_FIX_TAG, tags]);
}

exports.aceEditEvent = function(hook, context) {
  var editorInfo = context.editorInfo;
  var rep = context.rep;
  var eventType = context.callstack.editEvent.eventType;


  if (lineWasChangedByShortcut(eventType) || eventIsUndoOrRedo(eventType)) {
    updateDropdownToCaretLine(context);
    updateHeadingType.updateHeadingsTypeWhenUndoOrRedo(editorInfo, rep);
  }
}
var lineWasChangedByShortcut = function(eventType) {
  return eventType === scriptElementTransitionUtils.CHANGE_ELEMENT_BY_SHORTCUT_EVENT;
}

var eventIsUndoOrRedo = function(eventType){
  return eventType === UNDO_REDO_EVENT;
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context) {
  // prevent keys insert text and enter
  var ace = context.ace;
  preventCharacterKeysAndEnterOnSelectionMultiLine(context);
  fixSmallZooms.init();
  cutEvents.init(context);
  updateHeadingType.init(ace);
  updateDropdownWhenPadLoads(ace);

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
  })
};

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
  var lineOfFirstScriptElement = getLineNumberFromDOMLine($lineOfFirstScriptElement, rep);
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

var getLineNumberFromDOMLine = function ($line, rep) {
  var lineId     = $line.attr("id");
  var lineNumber = rep.lines.indexOfKey(lineId);

  return lineNumber;
}

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretAfterRemoveSelection", function(){
    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}

function updateDropdownWithValueChosen() {
  updateDropdownToCaretLine(this);
  setFocusOnEditor();
}

var setFocusOnEditor = function(){
  utils.getPadInner().find("#innerdocbody").focus();
}

// On caret position change show the current script element
exports.aceSelectionChanged = function(hook, context, cb) {
  var cs = context.callstack;

  // If it's an initial setup event then do nothing
  if(cs.type == "setBaseText" || cs.type == "setup" || cs.type == "importText") return false;
  updateDropdownToCaretLine(context);
}

exports.aceKeyEvent = function(hook, context) {
  var eventProcessed = false;
  var evt = context.evt;
  var rep = context.rep;
  var editorInfo = context.editorInfo;
  var callstack =  context.callstack;

  var handleShortcut = shortcuts.findHandlerFor(evt);
  var handleMerge    = mergeLines.findHandlerFor(context);

  // Cmd+[ or Cmd+]
  if (handleShortcut) {
    evt.preventDefault();
    handleShortcut(context);
    eventProcessed = true;
  }
  // BACKSPACE or DELETE
  else if (handleMerge) {
    // call function that handles merge
    var mergeShouldBeBlocked = handleMerge;

    // cannot merge lines, so do not process keys
    if (mergeShouldBeBlocked) {
      evt.preventDefault();
      eventProcessed = true;
    }
  }else if (keyEventIsUndoOrRedo(evt)) {
    callstack.startNewEvent(UNDO_REDO_EVENT);
  }

  return eventProcessed;
}

// cmd + z, cmd + shift + z
var keyEventIsUndoOrRedo = function(evt){
  var type               = evt.type;
  var isTypeForCmdKey    = ((browser.msie || browser.safari || browser.chrome) ? (type == "keydown") : (type == "keypress"));
  var cmdWasPressed = (isTypeForCmdKey && (evt.metaKey || evt.ctrlKey));
  var KeyZ = evt.keyCode === 90;

  return  cmdWasPressed && KeyZ;
}

exports.acePaste = function(hook, context){
  var rep = context.rep;
  var currentLine = rep.selStart[0];
  var e = context.e;
  var lineIsScriptElement = utils.lineIsScriptElement(currentLine);
  if (lineIsScriptElement){
    var $line = utils.getPadInner().find("div").slice(currentLine, currentLine + 1);
    $line.addClass(PASTE_ON_SE_CLASS);
  }
}

var preventCharacterKeysAndEnterOnSelectionMultiLine = function(context){
  var $innerDocument = utils.getPadInner().find("#innerdocbody");

  context.ace.callWithAce(function(ace){
    var rep = ace.ace_getRep();

    // keypress is fired when a key is pressed down and that key normally produces a character value
    $innerDocument.on("keypress", function(e){
      if(isMultipleLinesSelected(rep) && isCaretStartPositionInAScriptElement(rep)){
        e.preventDefault();
      }
    });

    // avoid ENTER
    $innerDocument.on("keydown", function(e){
      var enterIsPressed = e.keyCode === ENTER;
      if(isMultipleLinesSelected(rep) && enterIsPressed && isCaretStartPositionInAScriptElement(rep)){
        e.preventDefault();
        return false;
      }
    });
  });
}

var isCaretStartPositionInAScriptElement = function(rep){
  var firstLineOfSelection = rep.selStart[0];
  var lineIsScriptElement = utils.lineIsScriptElement(firstLineOfSelection);

  return lineIsScriptElement;
}

// Our script element attribute will result in a script_element:heading... :transition class
exports.aceAttribsToClasses = function(hook, context) {
  if (context.key === 'headingType'){
    return [ 'headingType:' + context.value];
  }
  if (context.key == 'script_element') {
    return [ 'script_element:' + context.value ];
  } else if (context.key === undoPagination.UNDO_FIX_ATTRIB) {
    return [ undoPagination.UNDO_FIX_ATTRIB ];
  }
}

exports.aceDomLineProcessLineAttributes = function(name, context) {
  var cls = context.cls;

  var lineModifier = processScriptElementAttribute(cls);
  if (lineModifier.length === 0) {
    lineModifier = processUndoFixAttribute(cls);
  }

  return lineModifier;
};

exports.acePostWriteDomLineHTML = function(hook, context) {
  var $node = $(context.node);
  var extraFlag = findExtraFlagForLine($node);
  if (extraFlag) {
    $node.addClass(extraFlag);
  }
}

var findExtraFlagForLine = function($node) {
  var sceneMarkTagIndex = -1;

  _.each(SM_AND_HEADING, function(tag) {
    var nodeHasTag = $node.find(tag).length;
    if (nodeHasTag) {
      sceneMarkTagIndex = _.indexOf(SM_AND_HEADING, tag);
      return; // found flagIndex, can stop each()
    }
  });

  return utils.SCENE_MARK_TYPE[sceneMarkTagIndex];
}

// Here we convert the class script_element:heading into a tag
var processScriptElementAttribute = function(cls) {
  var scriptElementType = /(?:^| )script_element:([A-Za-z0-9]*)/.exec(cls);
  var headintTypeAttrib = /(?:^| )headingType:([A-Za-z0-9]*)/.exec(cls);
  var tagIndex;

  if (scriptElementType) tagIndex = _.indexOf(tags, scriptElementType[1]);

  if (tagIndex !== undefined && tagIndex >= 0) {
    var tag = tags[tagIndex];

    var headingClass = getExtraHeadingClasses(tag, headintTypeAttrib);
    var modifier = {
      preHtml: '<' + tag + headingClass + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }

  return [];
}

var getExtraHeadingClasses = function(tag, headintTypeAttrib){
  var headingExtraClass = '';
  if(tag === 'heading' && headintTypeAttrib){
    headingExtraClass =  ' class="' + headintTypeAttrib[1] + '"';
  }
  return headingExtraClass;
}

var processUndoFixAttribute = function(cls) {
  if (cls.includes(undoPagination.UNDO_FIX_ATTRIB)) {
    var tag = undoPagination.UNDO_FIX_TAG;
    var modifier = {
      preHtml: '<' + tag + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }

  return [];
}

// Find out which lines are selected and assign them the script element attribute.
// Passing a level >= 0 will set a script element on the selected lines, level < 0
// will remove it
function doInsertScriptElement(level) {
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

function lineIsFirstHalfOfSliptLine(lineNumber, attributeManager) {
  return attributeManager.getAttributeOnLine(lineNumber, "splitFirstHalf");
}

function lineIsSecondHalfOfSliptLine(lineNumber, attributeManager) {
  return attributeManager.getAttributeOnLine(lineNumber, "splitSecondHalf");
}

function addAttributeIfElementIsNotSM(lineNumber, attributeManager, value) {
  // avoid applying SE attrib on SM tags
  var isLineScriptElement = utils.lineIsScriptElement(lineNumber);
  if(isLineScriptElement){
    attributeManager.removeAttributeOnLine(lineNumber, 'script_element');
    attributeManager.setAttributeOnLine(lineNumber, 'script_element', value);
  }
}

function removeAttribute(lineNumber, attributeManager) {
  attributeManager.removeAttributeOnLine(lineNumber, 'script_element');
}

function getLastLine(firstLine, rep) {
  var lastLineSelected = rep.selEnd[0];

  if (lastLineSelected > firstLine) {
    // Ignore last line if the selected text of it it is empty
    if(lastLineSelectedIsEmpty(rep, lastLineSelected)) {
      lastLineSelected--;
    }
  }
  return lastLineSelected;
}

function lastLineSelectedIsEmpty(rep, lastLineSelected) {
  var line = rep.lines.atIndex(lastLineSelected);
  // when we've a line with line attribute, the first char line position
  // in a line is 1 because of the *, otherwise is 0
  var firstCharLinePosition = lineHasMarker(line) ? 1 : 0;
  var lastColumnSelected = rep.selEnd[1];

  return lastColumnSelected === firstCharLinePosition;
}

function lineHasMarker(line) {
  return line.lineMarker === 1;
}

// Once ace is initialized, we set ace_doInsertScriptElement and bind it to the context
// and we set ace_removeSceneTagFromSelection and bind it to the context
exports.aceInitialized = function(hook, context) {
  var editorInfo = context.editorInfo;

  editorInfo.ace_removeSceneTagFromSelection = _(removeSceneTagFromSelection).bind(context);
  editorInfo.ace_doInsertScriptElement = _(doInsertScriptElement).bind(context);
  editorInfo.ace_updateDropdownWithValueChosen = _(updateDropdownWithValueChosen).bind(context);
  editorInfo.ace_cutEventsHandleCutOnScriptElements = _(cutEvents.handleCutOnScriptElements).bind(context);
  editorInfo.ace_updateHeadingType = _(updateHeadingType.updateHeadingType).bind(context);
}

exports.aceEditorCSS = function() {
  return cssFiles;
};

// Find out which lines are selected and remove scenetag from them
function removeSceneTagFromSelection() {
  var rep = this.rep;
  var documentAttributeManager = this.documentAttributeManager;
  if (!(rep.selStart && rep.selEnd)) {
    return;
  }

  var firstLine = rep.selStart[0];
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));

  _(_.range(firstLine, lastLine + 1)).each(function(line) { // for each line on selected range
    _.each(sceneTag, function(attribute) { // for each scene mark attribute
      documentAttributeManager.removeAttributeOnLine(line, attribute);
    });
  });

}

function updateDropdownToCaretLine(context) {
  setTimeout(function() {
    var rep              = context.rep;
    var attributeManager = context.documentAttributeManager;

    var multipleLinesSelected  = isMultipleLinesSelected(rep);
    var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);

    var lineNumber  = rep.selStart[0];
    var isLineScriptElement = utils.lineIsScriptElement(lineNumber);
    if (multipleLinesSelected && !sameElementOnSelection || !isLineScriptElement) {
      //set drop-down to "Style"
      setDropdownValue(-2);
    }else{
      var currentLine = rep.selStart[0];
      var elementOfCurrentLine = attributeManager.getAttributeOnLine(currentLine, "script_element") || "general";
      setDropdownToElement(elementOfCurrentLine);
    }
  }, 100);
}

function isSameElementOnSelection(rep, attributeManager) {
  var firstLine = rep.selStart[0];
  var isSameElement = true;
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  //get the first attribute on the selection
  var firstAttribute = attributeManager.getAttributeOnLine(firstLine, "script_element");
  //check if the first attribute on selection is present in all lines
  _(_.range(firstLine + 1, lastLine + 1)).each(function(line) {
    var attributeOnline = attributeManager.getAttributeOnLine(line, "script_element");
    if (attributeOnline !== firstAttribute) {
      isSameElement = false;
      return;
    }
  });
  return isSameElement;
}

function setDropdownToElement(attr) {
  var newValue = tags.indexOf(attr);
  setDropdownValue(newValue);
}

function setDropdownValue(newValue) {
  // only change value if necessary
  if ($("#script_element-selection").val() === newValue) return;

  // change value and trigger event
  // (we need to manually trigger an event because val() does not trigger the "change" event)
  $("#script_element-selection").val(newValue).trigger("selectElementChange");
}

function isMultipleLinesSelected(rep) {
  var firstLineSelected = rep.selStart[0];
  var lastLineSelected = rep.selEnd[0];
  return (firstLineSelected !== lastLineSelected);
}

