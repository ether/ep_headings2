var _ = require('ep_etherpad-lite/static/js/underscore');

var utils   = require('./utils');
var SMUtils = require('ep_script_scene_marks/static/js/utils');

var PASTE_ON_SE_CLASS = '.pasteOnSE';
var PART_OF_COMPLETE_SM_CLASS = 'part_of_sm_complete';
var TAG_ALREADY_PROCESSED_CLASS = 'processed_find_sm_interval';

// This hook only collect text nodes. Empty nodes, e.g. <tag><br></tag>, are not collected in this hook
exports.collectContentLineText = function(hook, context) {
  var $lineTargetOfPaste = utils.getPadInner().find(PASTE_ON_SE_CLASS);
  var pasteOnSE = $lineTargetOfPaste.length;
  if(pasteOnSE){
    removeEmptyHiddenSceneMarks($lineTargetOfPaste);
    changeToActionIfItIsPartOfAnInvalidSM(context, $lineTargetOfPaste);
  }
}

// we change to actions every scene mark which is not part of a valid scene mark
// (e.g. when user pastes a act_summary and heading)
var changeToActionIfItIsPartOfAnInvalidSM = function(context, $lineTargetOfPaste){
  var $node = $(context.node);
  var state = context.state;
  var lineAttributes = state.lineAttributes;
  var $linesPasted = $lineTargetOfPaste.children("div");
  var hasSceneMarkPasted = $linesPasted.find('act_name, act_summary, sequence_name, sequence_summary').length;

  if(!hasSceneMarkPasted){
    return;
  }
  markSceneMarksValid($linesPasted);
  changeInvalidSceneMarksToAction($node, lineAttributes);
}

var markSceneMarksValid = function($linesPasted) {
  _.each($linesPasted, function(line){
    var $line = $(line);
    var tagAlreadyProcessed = $line.filter('.' + TAG_ALREADY_PROCESSED_CLASS).length;
    var isSceneMark = $line.find('act_name, act_summary, sequence_name, sequence_summary').length;

    if(!tagAlreadyProcessed && isSceneMark){
      // take all scene marks until the heading
      var $lines = $line.nextUntil('div:has(heading)').addBack();
      var linesHaveHeadingOfReference = $lines.last().next().find('heading').length;

      // avoid reprocessing this scene marks range in the next iteration
      $lines.addClass(TAG_ALREADY_PROCESSED_CLASS);
      var isSceneMarkTitle = $line.find('act_name, sequence_name').length;

      if(isSceneMarkTitle && linesHaveHeadingOfReference){
        // mark scene marks range as complete scene mark, so we keep them
        // when the Etherpad collects the line
        $lines.addClass(PART_OF_COMPLETE_SM_CLASS);
      }
    }
  });
}

var changeInvalidSceneMarksToAction = function($node, lineAttributes) {
  var isASceneMark = lineAttributes.act_scene_mark || lineAttributes.sequence_scene_mark;
  var isNodePartOfAValidSceneMark = $node.closest('div').hasClass(PART_OF_COMPLETE_SM_CLASS);
  if(isASceneMark && !isNodePartOfAValidSceneMark){
    resetPreviousLineAttribs(lineAttributes);
    transformLineToAction(lineAttributes);
  }
}

// delete all attrib if it is not default attribs
var resetPreviousLineAttribs = function(lineAttributes){
  var lineAttributesKeys = _.keys(lineAttributes);
  var lineAttributesKeysWithoutDefaultLineAttribs = _.difference(lineAttributesKeys, utils.DEFAULT_LINE_ATTRIBS);
  _.each(lineAttributesKeysWithoutDefaultLineAttribs, function(keysToRemove){
    delete(lineAttributes[keysToRemove]);
  });
}

var transformLineToAction = function(lineAttributes) {
  lineAttributes['script_element'] = 'action';
}

var removeEmptyHiddenSceneMarks = function($line) {
  var $linesPasted = $line.find("div");
  _.each($linesPasted, function(line){
    var $line = $(line);
    var linesIsSceneMark = SMUtils.checkIfHasSceneMark($line);

    // we consider as empty every line which has <span> but it has no text
    // by default, empty line on etherpad has only <br>
    var lineHasSpan = $line.find("span").length;
    var lineHasText = $line.text().length;
    var lineIsEmpty = lineHasSpan && !lineHasText;
    if(linesIsSceneMark && lineIsEmpty){
      $line.remove();
    }
  });
}