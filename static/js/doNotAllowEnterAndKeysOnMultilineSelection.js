var utils = require('./utils');

var ENTER = 13;

exports.init = function(){
  var $editor = utils.getPadInner().find('#innerdocbody');
  preventReplacingMultipleScriptElementLinesWithAChar($editor);
  preventDeletingMultipleScriptElementLinesWithEnter($editor);
}

var preventReplacingMultipleScriptElementLinesWithAChar = function($editor) {
  $editor.on('keypress', function(e) {
    if(utils.isMultipleLineSelected() && utils.selectionStartsOnAScriptElement()) {
      e.preventDefault();
    }
  });
}

var preventDeletingMultipleScriptElementLinesWithEnter = function($editor) {
  $editor.on('keydown', function(e) {
    var enterIsPressed = e.keyCode === ENTER;
    if (enterIsPressed && utils.isMultipleLineSelected() && utils.selectionStartsOnAScriptElement()) {
      e.preventDefault();
      return false;
    }
  });
}
