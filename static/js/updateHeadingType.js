var _ = require('ep_etherpad-lite/static/js/underscore');

var utils = require("./utils");
var sceneMarksUtils = require("ep_script_scene_marks/static/js/utils");
var SM_ADDED_OR_REMOVED_EVENT = sceneMarksUtils.SCENE_MARK_ADD_EVENT + ' ' + sceneMarksUtils.SCENE_MARK_REMOVED_EVENT;
var FIND_HEADING_TARGET_ON_DIRECTION = {
  'sceneMarkRemoved': findHeadingTargetAbove,
  'sceneMarkAdded': findHeadingTargetBelow
};

// we only mark the headings with sequences
// to mark the heading with acts uncomment the line below
var HEADING_TYPE_VALUE = {
  // act_name: 'sceneWithAct',
  sequence_name: 'sceneWithSequence',
};
var HEADING_TYPE_KEY = 'headingType';

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
      ace.ace_updateHeadingType(line, event);
    });
  });
}

var findSceneMarkOfHeading = function (line) {
  var firstSceneMarkOfHeading;
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $sceneMarksAbove = $line.prevUntil("div:not(.sceneMark)").addBack();
  if($sceneMarksAbove.first().find("sequence_name").length !== 0){
    firstSceneMarkOfHeading = "sequence_name";
  }
  return firstSceneMarkOfHeading;
}

exports.updateHeadingType = function (line, event) {
  var attributeManager = this.documentAttributeManager;
  var editorInfo       = this.editorInfo;
  var rep              = this.rep;

  var headingLine = getHeadingOfChange(line, rep, event);
  var firstSceneMarkOfHeading = findSceneMarkOfHeading(headingLine);
  var headingTypeValue = HEADING_TYPE_VALUE[firstSceneMarkOfHeading];

  editorInfo.ace_inCallStackIfNecessary("nonundoable", function(){
    if(headingTypeValue !== undefined){
      attributeManager.setAttributeOnLine(headingLine, HEADING_TYPE_KEY, headingTypeValue);
    }else{
      attributeManager.removeAttributeOnLine(headingLine, HEADING_TYPE_KEY);
    }
  });
}

var getHeadingOfChange = function (line, rep, event) {
  var lineNumberOfHeadingOfChange = line;
  var $line = utils.getPadInner().find("div").slice(line, line + 1)
  var lineHasHeading = $line.find("heading").length === 1;

  if(!lineHasHeading){
    // when user adds a scene mark the heading goes down, when user removes it goes up.
    // As we listen to both events, we have to know if we have to look up or down
    // for the new heading position
    lineNumberOfHeadingOfChange = FIND_HEADING_TARGET_ON_DIRECTION[event.type](line, rep);
  }
  return lineNumberOfHeadingOfChange;
}

function findHeadingTargetAbove (line, rep){
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $targetLine = $line.prevUntil("div:has(heading)").addBack().first().prev();
  var lineTarget = utils.getLineNumberFromDOMLine($targetLine, rep)
  return lineTarget;
}

function findHeadingTargetBelow (line, rep) {
  var $line = utils.getPadInner().find("div").slice(line, line + 1);
  var $targetLine = $line.nextUntil("div:has(heading)").last().next();
  var lineTarget = utils.getLineNumberFromDOMLine($targetLine, rep)
  return lineTarget;
}
