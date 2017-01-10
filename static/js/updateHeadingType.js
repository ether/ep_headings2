var _ = require('ep_etherpad-lite/static/js/underscore');

var utils = require("./utils");
var sceneMarksUtils = require("ep_script_scene_marks/static/js/utils");
var SM_ADD_OR_REMOVE_EVENT = sceneMarksUtils.SCENE_MARK_ADD_EVENT + ' ' + sceneMarksUtils.SCENE_MARK_REMOVE_EVENT;

var HEADING_TYPE_KEY = 'headingType';
var HEADING_TYPE_VALUE = {
  'scene_name': 'headingWithSynopsis',
  'sequence_name': 'headingWithSequence',
  'act_name': 'headingWithAct',
};

exports.init = function (ace) {
  updateHeadingsType(ace);
  updateHeadingTypeWhenItsSMIsChanged(ace);
}

var updateHeadingsTypeWhenUndoOrRedo = function(editorInfo, rep) {
  var $headings = utils.getPadInner().find("div:has(heading)");
  var headingsLine = getHeadingsLine($headings, rep);
  editorInfo.ace_updateHeadingType(headingsLine);
}
exports.updateHeadingsTypeWhenUndoOrRedo = updateHeadingsTypeWhenUndoOrRedo;

var updateHeadingsType = function (ace) {
  ace.callWithAce(function(ace){
    var rep = ace.ace_getRep();
    var $headings = utils.getPadInner().find("div:has(heading)");
    var headingsLine = getHeadingsLine($headings, rep);
    ace.ace_updateHeadingType(headingsLine);
  })
}
exports.updateHeadingsType = updateHeadingsType;

var getHeadingsLine = function ($headings, rep) {
  return _.map($headings, function (heading) {
    var $heading = $(heading);
    var line = utils.getLineNumberFromDOMLine($heading, rep);
    return line;
  });
}

// listen to events that changes the heading type which can be triggered for any plugin
var updateHeadingTypeWhenItsSMIsChanged = function (ace) {
  var $innerDocument = utils.getPadInner().find("#innerdocbody");
  $innerDocument.on(SM_ADD_OR_REMOVE_EVENT, function(event, lines) { // sm_remove events can send more than one line
    ace.callWithAce(function(ace){
      ace.ace_updateHeadingType(lines);
    });
  });
}

var getFirstSMOfHeading = function(line) {
  var tagName;
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $sceneMarksAbove = $line.prevUntil("div:not(.sceneMark)").addBack();
  var $firstSMOfHeading = $sceneMarksAbove.first().find(sceneMarksUtils.SCENE_MARK_TITLES_SELECTOR);

  // avoid error of not finding the scene mark when creating heading without SM yet
  // for example when it creates a scene with cmd + 1
  if($firstSMOfHeading.length){
    tagName = $firstSMOfHeading[0].localName;
  }

  return tagName;
}

exports.updateHeadingType = function (lines) {
  var attributeManager = this.documentAttributeManager;
  var editorInfo       = this.editorInfo;
  var rep              = this.rep;
  _.each(lines, function(line){
    var headingLine = getHeadingOfChange(line, rep);
    if(headingLine){
      var firstSMOfHeading = getFirstSMOfHeading(headingLine);
      editorInfo.ace_inCallStackIfNecessary("nonundoable", function(){
        if(firstSMOfHeading){
          updateHeadingTypeIfNecessary(attributeManager, headingLine, firstSMOfHeading);
        }
      });
    }
  });
}

var getHeadingTypeAttribOfLine = function(attributeManager, lineNumber) {
  return attributeManager.getAttributeOnLine(lineNumber, HEADING_TYPE_KEY);
}

var updateHeadingTypeIfNecessary = function(attributeManager, headingLine, firstSMOfHeading) {
  var currentHeadingTypeAttrib = getHeadingTypeAttribOfLine(attributeManager, headingLine);
  var attribValue = HEADING_TYPE_VALUE[firstSMOfHeading]; // attrib might be applied
  var lineAlreadyHasTheRightHeadingTypeAttrib = attribValue === currentHeadingTypeAttrib;

  if(!lineAlreadyHasTheRightHeadingTypeAttrib) {
    attributeManager.removeAttributeOnLine(headingLine, HEADING_TYPE_KEY);
    attributeManager.setAttributeOnLine(headingLine, HEADING_TYPE_KEY, attribValue);
  }
}

var getHeadingOfChange = function (line, rep) {
  var lineNumberOfHeadingOfChange = line;
  var $line = utils.getPadInner().find("div").slice(line, line + 1)
  var lineIsHeading = $line.find("heading").length === 1;
  if(!lineIsHeading){
    lineNumberOfHeadingOfChange = findTargetHeadingBelow(line, rep);
  }
  return lineNumberOfHeadingOfChange;
}

// this function is called when a SM is added or removed. When we add a scene mark to a heading, its position
// goes below to the previous position. When we remove a scene mark using the trash icon, the line sent is related
// to the position of the scene mark removed. So, the heading is in a position below of line as well.
// There's a special case which happens when we remove a scene mark and remove the heading, and this heading was the last
// one of the script. We have no other heading below to update, so we return line as undefined to avoid applying
// the attrib in a non-heading line.
var findTargetHeadingBelow  = function(line, rep) {
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $targetLine = $line.nextUntil("div:has(heading)").last().next();
  var targetLineIsHeading = $targetLine.find('heading').length;

  return targetLineIsHeading ? utils.getLineNumberFromDOMLine($targetLine, rep) : undefined;
}