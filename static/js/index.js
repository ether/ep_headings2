var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var scriptElementTransitionUtils = require("ep_script_element_transitions/static/js/utils");

var tags     = require('ep_script_elements/static/js/shared').tags;
var sceneTag = require('ep_script_elements/static/js/shared').sceneTag;

var utils                    = require('./utils');
var SM_AND_HEADING           = _.union(utils.SCENE_MARK_SELECTOR, ['heading']);
var shortcuts                = require('./shortcuts');
var mergeLines               = require('./mergeLines');
var undoPagination           = require('./undoPagination');
var fixSmallZooms            = require('./fixSmallZooms');
var dropdown                 = require('./dropdown');
var preventMultilineDeletion = require('./doNotAllowEnterAndKeysOnMultilineSelection');

// 'undo' & 'redo' are triggered by toolbar buttons; other events are triggered by key shortcuts
var UNDO_REDO_EVENTS = ['handleKeyEvent', 'undo', 'redo']

var cssFiles = ['ep_script_elements/static/css/editor.css'];

// All our tags are block elements, so we just return them.
exports.aceRegisterBlockElements = function() {
  return _.flatten([undoPagination.UNDO_FIX_TAG, tags]);
}

exports.aceEditEvent = function(hook, context) {
  var callstack  = context.callstack;
  var eventType  = callstack.editEvent.eventType;

  if (lineWasChangedByShortcut(eventType) || eventMightBeAnUndo(callstack)) {
    dropdown.updateDropdownToCaretLine(context);
  }
}

var lineWasChangedByShortcut = function(eventType) {
  return eventType === scriptElementTransitionUtils.CHANGE_ELEMENT_BY_SHORTCUT_EVENT;
}

var eventMightBeAnUndo = function(callstack) {
  var isAnUndoRedoCandidate = _(UNDO_REDO_EVENTS).contains(callstack.editEvent.eventType);
  return callstack.repChanged && isAnUndoRedoCandidate;
}

exports.postAceInit = function(hook, context) {
  var ace = context.ace;

  preventMultilineDeletion.init();
  fixSmallZooms.init();
  dropdown.init(ace);
};

// On caret position change show the current script element
exports.aceSelectionChanged = function(hook, context, cb) {
  var cs = context.callstack;

  // If it's an initial setup event then do nothing
  if(cs.type == "setBaseText" || cs.type == "setup" || cs.type == "importText") return false;
  dropdown.updateDropdownToCaretLine(context);
}

exports.aceKeyEvent = function(hook, context) {
  var eventProcessed = false;
  var evt = context.evt;
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
  }

  return eventProcessed;
}

// Our script element attribute will result in a script_element:heading... :transition class
exports.aceAttribsToClasses = function(hook, context) {
  if (context.key === 'script_element') {
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
  var $line = $(context.node);
  var extraFlag = findExtraFlagForLine($line);
  if (extraFlag) {
    $line.addClass(extraFlag);
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
  var tagIndex;

  if (scriptElementType) tagIndex = _.indexOf(tags, scriptElementType[1]);

  if (tagIndex !== undefined && tagIndex >= 0) {
    var tag = tags[tagIndex];
    var modifier = {
      preHtml: '<' + tag +'>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }

  return [];
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

// Once ace is initialized, we set ace_doInsertScriptElement and bind it to the context
// and we set ace_removeSceneTagFromSelection and bind it to the context
exports.aceInitialized = function(hook, context) {
  var editorInfo = context.editorInfo;

  editorInfo.ace_removeSceneTagFromSelection = _(removeSceneTagFromSelection).bind(context);
  editorInfo.ace_doInsertScriptElement = _(dropdown.doInsertScriptElement).bind(context);
  editorInfo.ace_updateDropdownWithValueChosen = _(dropdown.updateDropdownWithValueChosen).bind(context);
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
