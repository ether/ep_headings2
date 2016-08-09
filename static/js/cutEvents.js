var utils = require('./utils');
var BLACKLIST_TAGS = "act_name, act_summary, sequence_name, sequence_summary";
var mergeLines = require('./mergeLines');


exports.init = function(context){
  context.ace.callWithAce(function(ace){
    ace.ace_cutEventsHandleCutOnScriptElements();
  });
}

// This code is quite similar to cutEvent on scene marks
var handleCutOnScriptElements = function(){
  var context = this;
  var rep = context.rep;
  var editorInfo = context.editorInfo;
  var $editor = utils.getPadInner().find("#innerdocbody");

  $editor.on("cut", function(e){
    var currentLine = rep.selStart[0];
    var lineIsScriptElement = utils.lineIsScriptElement(currentLine);
    var multiLineSelected = isMultiLineSelected(rep, editorInfo);

    if(lineIsScriptElement && multiLineSelected){
      // remove scene marks tags
      var htmlReadyToPaste = getHtmlFromSelectionAndRemoveTagsNotAllowed();
      e.originalEvent.clipboardData.setData('text/html', htmlReadyToPaste);

      // In this line we apply the same rules of deletion in multi line selected,
      // implemented in the mergeLines module of this plugin
      editorInfo.ace_inCallStackIfNecessary("remove_lines_by_cut", function(){
        mergeLines.processTextSelected(context);
      });

      e.preventDefault();
    }
  });
}
exports.handleCutOnScriptElements = handleCutOnScriptElements;

var isMultiLineSelected = function(rep, editorInfo){
  return rep.selStart[0] !== rep.selEnd[0];
}

var getHtmlFromSelectionAndRemoveTagsNotAllowed = function(){
  var range = utils.getPadInner()[0].getSelection().getRangeAt(0);
  var $hiddenDiv = createHiddenDiv(range);
  var htmlFromSelection = $hiddenDiv.html();

  // wraps in a span to make easier the processing
  var $html = $("<span></span>").html(htmlFromSelection);

  // replace SM with spans
  replaceTagsNotAllowedBySpan($html);

  return $html.html();
}

var createHiddenDiv = function(range){
  var content = range.cloneContents();
  var div = document.createElement("div");
  var $hiddenDiv = $(div).html(content);
  return $hiddenDiv;
};

var replaceTagsNotAllowedBySpan = function($html){
  $html.find(BLACKLIST_TAGS).replaceWith(function(){
    return $("<span></span>").html($(this).contents());
  });
}