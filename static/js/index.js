var _, $, jQuery;

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var tags = require('ep_script_elements/static/js/shared').tags;
var sceneTag = require('ep_script_elements/static/js/shared').sceneTag;
var findHandlerFor = require('./shortcuts').findHandlerFor;
var cssFiles = ['ep_script_elements/static/css/editor.css'];
var keyShouldBeIgnored  = require('./mergeLines').keyShouldBeIgnored;
var padInner = require("./utils").getPadInner;

// All our tags are block elements, so we just return them.
exports.aceRegisterBlockElements = function(){
  return tags;
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
  listeningChangeElementByShortCut();

  var script_element_selection = $('#script_element-selection');
  script_element_selection.on('change', function(){
    var value = $(this).val();
    var intValue = parseInt(value,10);
    var selectedOption = $(this).find("option:selected");
    var l10nLabel = selectedOption.attr("data-l10n-id");
    if(!_.isNaN(intValue)){
      context.ace.callWithAce(function(ace){
        ace.ace_doInsertScriptElement(intValue);
      },'insertscriptelement' , true);
      script_element_selection.val("dummy");
    }
    //if change to a button different from heading removes sceneTag line attributes
    if (l10nLabel !== "ep_script_elements.heading") {
      context.ace.callWithAce(function(ace){
        ace.ace_removeSceneTagFromSelection();
      },'removescenetag' , true);
    }
  })
};

function listeningChangeElementByShortCut(){
  var $innerDocument = padInner().find("#innerdocbody");
  // ep_script_element_transition triggers 'elementChange' event when element is
  // changed by shortcut CMD+NUM, which means the type of current line was changed,
  // so we need to update the dropdown. We take the context from ep_script_element_transition
  // which is passed when then event happens
  $innerDocument.on('elementChanged', function(event, context){
    updateDropdownToCaretLine(context);
  });
}

// On caret position change show the current script element
exports.aceSelectionChanged = function(hook, context, cb){
  var cs = context.callstack;

  // If it's an initial setup event then do nothing
  if(cs.type == "setBaseText" || cs.type == "setup" || cs.type == "importText") return false;
  updateDropdownToCaretLine(context);
}

exports.aceKeyEvent = function(hook, context) {
  var eventProcessed = false;
  var evt = context.evt;

  var handleShortcut = findHandlerFor(evt);
  if (handleShortcut) {
    evt.preventDefault();
    handleShortcut(context);
    eventProcessed = true;
  }else if(keyShouldBeIgnored(context)){
    evt.preventDefault();
    eventProcessed = true;
  }

  return eventProcessed;
}

// Our script element attribute will result in a script_element:heading... :transition class
exports.aceAttribsToClasses = function(hook, context){
  if(context.key == 'script_element'){
    return ['script_element:' + context.value ];
  }
}

// Here we convert the class script_element:heading into a tag
exports.aceDomLineProcessLineAttributes = function(name, context){
  var cls = context.cls;
  var domline = context.domline;
  var scriptElementType = /(?:^| )script_element:([A-Za-z0-9]*)/.exec(cls);
  var tagIndex;

  if (scriptElementType) tagIndex = _.indexOf(tags, scriptElementType[1]);

  if (tagIndex !== undefined && tagIndex >= 0){

    var tag = tags[tagIndex];
    var modifier = {
      preHtml: '<' + tag + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }
  return [];
};

// Find out which lines are selected and assign them the script element attribute.
// Passing a level >= 0 will set a script element on the selected lines, level < 0
// will remove it
function doInsertScriptElement(level){
  var rep = this.rep,
    documentAttributeManager = this.documentAttributeManager;
  if (!(rep.selStart && rep.selEnd) || (level >= 0 && tags[level] === undefined))
  {
    return;
  }

  var firstLine, lastLine;

  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each(function(i){
    if(level >= 0){
      documentAttributeManager.setAttributeOnLine(i, 'script_element', tags[level]);
    }else{
      documentAttributeManager.removeAttributeOnLine(i, 'script_element');
    }
  });
}


// Once ace is initialized, we set ace_doInsertScriptElement and bind it to the context
// and we set ace_removeSceneTagFromSelection and bind it to the context
exports.aceInitialized = function(hook, context){
  var editorInfo = context.editorInfo;

  editorInfo.ace_removeSceneTagFromSelection = _(removeSceneTagFromSelection).bind(context);
  editorInfo.ace_doInsertScriptElement = _(doInsertScriptElement).bind(context);
}

exports.aceEditorCSS = function(){
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

function updateDropdownToCaretLine(context){
  setTimeout(function() {
    var rep              = context.rep;
    var attributeManager = context.documentAttributeManager;

    var multipleLinesSelected  = isMultipleLinesSelected(rep);
    var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);

    if (multipleLinesSelected && !sameElementOnSelection){
      //set drop-down to "Style"
      setDropdownValue(-2);
    }else{
      var currentLine = rep.selStart[0];
      var elementOfCurrentLine = attributeManager.getAttributeOnLine(currentLine, "script_element") || "general";
      setDropdownToElement(elementOfCurrentLine);
    }
  }, 100);
}

function isSameElementOnSelection(rep, attributeManager){
  var firstLine = rep.selStart[0];
  var isSameElement = true;
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  //get the first attribute on the selection
  var firstAttribute = attributeManager.getAttributeOnLine(firstLine, "script_element");
  //check if the first attribute on selection is present in all lines
  _(_.range(firstLine + 1, lastLine + 1)).each(function(line){
    var attributeOnline = attributeManager.getAttributeOnLine(line, "script_element");
    if (attributeOnline !== firstAttribute){
      isSameElement = false;
      return;
    }
  });
  return isSameElement;
}

function setDropdownToElement(attr){
  var newValue = tags.indexOf(attr);
  setDropdownValue(newValue);
}

function setDropdownValue(newValue){
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

