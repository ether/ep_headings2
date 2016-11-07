var utils          = require('./utils');
var sceneMarkUtils = require("ep_script_scene_marks/static/js/utils");
var mergeLines     = require('./mergeLines');


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
      var plainText = getPlainText();
      // remove scene marks tags
      var htmlReadyToPaste = getHtmlFromSelectionAndRemoveTagsNotAllowed();
      e.originalEvent.clipboardData.setData('text/html', htmlReadyToPaste);
      e.originalEvent.clipboardData.setData('text/plain', plainText);

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
  replaceSceneMarksTagsWithSpan($html);

  return $html.html();
}

var getPlainText = function(){
  var range = utils.getPadInner()[0].getSelection().getRangeAt(0);
  var $hiddenDiv = createHiddenDiv(range);
  var lines = $hiddenDiv[0].childNodes;
  var textOfLines = getTextOfLines(lines);

  var textWithLineBreaks = _.reduce(textOfLines, function(memo, text){
    var textOfLine = '\n' + text;
    return memo + textOfLine;
  });

  return textWithLineBreaks;
}

var getTextOfLines = function(lines){
  return _.map(lines, function(line){
    return line.innerText;
  });
}

var createHiddenDiv = function(range){
  var content = range.cloneContents();
  var div = document.createElement("div");
  var $hiddenDiv = $(div).html(content);
  return $hiddenDiv;
};

var replaceSceneMarksTagsWithSpan = function($html){
  var sceneMarks = sceneMarkUtils.sceneMarkTags.toString();
  $html.find(sceneMarks).replaceWith(function(){
    return $("<span></span>").html($(this).contents());
  });
}