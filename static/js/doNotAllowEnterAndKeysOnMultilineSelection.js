var utils = require('./utils');

var ENTER = 13;

exports.init = function(ace){
  var $editor = utils.getPadInner().find('#innerdocbody');

  ace.callWithAce(function(ace){
    // FIXME rep might not be up to date. Do we need to call fastIncorp()?
    var rep = ace.ace_getRep();

    // keypress is fired when a key is pressed down and that key normally produces a character value
    $editor.on('keypress', function(e){
      if(utils.isMultipleLinesSelected(rep) && selectionStartsOnAScriptElement(rep)){
        e.preventDefault();
      }
    });

    // avoid ENTER
    $editor.on('keydown', function(e){
      var enterIsPressed = e.keyCode === ENTER;
      if(utils.isMultipleLinesSelected(rep) && enterIsPressed && selectionStartsOnAScriptElement(rep)){
        e.preventDefault();
        return false;
      }
    });
  });
}

var selectionStartsOnAScriptElement = function(rep){
  var firstLineOfSelection = rep.selStart[0];
  var lineIsScriptElement = utils.lineIsScriptElement(firstLineOfSelection);

  return lineIsScriptElement;
}
