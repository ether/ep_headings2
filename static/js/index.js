var _, $, jQuery;

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var tags = require('ep_script_elements/static/js/shared').tags;
var sceneTag = require('ep_script_elements/static/js/shared').sceneTag;
var cssFiles = ['ep_script_elements/static/css/editor.css'];

// All our tags are block elements, so we just return them.
exports.aceRegisterBlockElements = function(){
  return tags;
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
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

// On caret position change show the current script element
exports.aceEditEvent = function(hook, call, cb){
  var editorInfo = call.editorInfo;
  editorInfo.ace_fastIncorp(2);
  updateDropdownToCaretLine(call);
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
  var padOuter = $('iframe[name="ace_outer"]').contents();
  var padInner = padOuter.find('iframe[name="ace_inner"]');
  //change the dropdown to the element where is the caret
  padInner.contents().find("body").on("click", function() {
    updateDropdownToCaretLine(context);
  })

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
  var editorInfo       = context.editorInfo;
  setTimeout(function() {
    var rep = context.rep;
    var multipleSelected = isMultipleLineSelected(rep);
    var attributeManager = context.documentAttributeManager;
    var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);
    if (multipleSelected && !sameElementOnSelection){
      //set drop-down to style
      $("#script_element-selection").val(-2);
    }else{
      var line = editorInfo.ace_caretLine();
      var attr = attributeManager.getAttributeOnLine(line, "script_element") || "general";
      setDropdownTo(attr);
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

function setDropdownTo(attr){
  var ind = tags.indexOf(attr);
  if ($("#script_element-selection").val == ind) return;
  $("#script_element-selection").val(ind);
}

function isMultipleLineSelected(rep) {
  var firstLineSelected = rep.selStart[0];
  var lastLineSelected = rep.selEnd[0];
  return (firstLineSelected !== lastLineSelected);
}

