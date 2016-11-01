var _ = require('ep_etherpad-lite/static/js/underscore');

var utils = require("./utils");
var sceneMarksUtils = require("ep_script_scene_marks/static/js/utils");
var SM_ADDED_OR_REMOVED_EVENT = sceneMarksUtils.SCENE_MARK_ADD_EVENT + ' ' + sceneMarksUtils.SCENE_MARK_REMOVED_EVENT;

var HEADING_TYPE_KEY = 'headingType';
var HEADING_TYPE_VALUE = 'sceneWithSequence';

exports.init = function (ace) {
  updateHeadingsType(ace);
  updateHeadingTypeWhenItsSMIsChanged(ace);
}

var updateHeadingsTypeWhenUndoOrRedo = function(editorInfo, rep) {
  var $headings = utils.getPadInner().find("div:has(heading)");
  var headingsLine = getHeadingsLine($headings, rep);
  _.each(headingsLine, function (headingLine) {
    editorInfo.ace_updateHeadingType(headingLine);
  });
}
exports.updateHeadingsTypeWhenUndoOrRedo = updateHeadingsTypeWhenUndoOrRedo;

var updateHeadingsType = function (ace) {
  ace.callWithAce(function(ace){
    var rep = ace.ace_getRep();
    var $headings = utils.getPadInner().find("div:has(heading)");
    var headingsLine = getHeadingsLine($headings, rep);
    _.each(headingsLine, function (headingLine) {
      ace.ace_updateHeadingType(headingLine);
    });

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
  $innerDocument.on(SM_ADDED_OR_REMOVED_EVENT, function(event, line) {
    ace.callWithAce(function(ace){
      ace.ace_updateHeadingType(line);
    });
  });
}

var isFirstSMOfHeadingASequence = function (line) {
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $sceneMarksAbove = $line.prevUntil("div:not(.sceneMark)").addBack();
  var isFirstSMOfHeadingASequence = $sceneMarksAbove.first().find("sequence_name").length !== 0;

  return isFirstSMOfHeadingASequence;
}

exports.updateHeadingType = function (line) {
  var attributeManager = this.documentAttributeManager;
  var editorInfo       = this.editorInfo;
  var rep              = this.rep;

  var headingLine = getHeadingOfChange(line, rep);
  var firstSMOfHeadingIsASequence = isFirstSMOfHeadingASequence(headingLine);

  editorInfo.ace_inCallStackIfNecessary("nonundoable", function(){
    if(firstSMOfHeadingIsASequence){
      attributeManager.setAttributeOnLine(headingLine, HEADING_TYPE_KEY, HEADING_TYPE_VALUE);
    }else{
      attributeManager.removeAttributeOnLine(headingLine, HEADING_TYPE_KEY);
    }
  });
}

var getHeadingOfChange = function (line, rep) {
  var lineNumberOfHeadingOfChange = line;
  var $line = utils.getPadInner().find("div").slice(line, line + 1)
  var lineHasHeading = $line.find("heading").length === 1;
  if(!lineHasHeading){
    // in both add or remove SM events the line returned is the above
    // of the heading of reference.
    lineNumberOfHeadingOfChange = findHeadingTargetBelow(line, rep);
  }
  return lineNumberOfHeadingOfChange;
}

var findHeadingTargetBelow  = function(line, rep) {
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $targetLine = $line.nextUntil("div:has(heading)").last().next();
  var lineTarget = utils.getLineNumberFromDOMLine($targetLine, rep)
  return lineTarget;
}
