var _ = require('ep_etherpad-lite/static/js/underscore');

var utils   = require('./utils');
var SMUtils = require('ep_script_scene_marks/static/js/utils');

var PASTE_ON_SE_CLASS = '.pasteOnSE';

// This hook only collect text nodes. Empty nodes, e.g. <tag><br></tag>, are not collected in this hook
exports.collectContentLineText = function(hook, context) {
  var $lineTargetOfPaste = utils.getPadInner().find(PASTE_ON_SE_CLASS);
  var pasteOnSE = $lineTargetOfPaste.length;
  if(pasteOnSE){
    removeEmptyHiddenSceneMarks($lineTargetOfPaste);
  }
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