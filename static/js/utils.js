var _                        = require('ep_etherpad-lite/static/js/underscore');
var SCRIPT_ELEMENTS_SELECTOR = require('./shared').tags;
exports.SCENE_MARK_SELECTOR  = require("ep_script_scene_marks/static/js/shared").sceneMarkTags;

var LINE_ELEMENTS_SELECTOR   = _.union(SCRIPT_ELEMENTS_SELECTOR, exports.SCENE_MARK_SELECTOR).join(", ");
var SE_TAGS_AND_GENERAL      = _.union(SCRIPT_ELEMENTS_SELECTOR, ["general"]);
exports.DEFAULT_LINE_ATTRIBS = ['author', 'lmkr', 'insertorder', 'start'];

exports.CHANGE_ELEMENT_EVENT = 'insertscriptelement';

// Easier access to outer pad
var padOuter;
exports.getPadOuter = function() {
 padOuter = padOuter || $('iframe[name="ace_outer"]').contents();
 return padOuter;
}

// Easier access to inner pad
var padInner;
exports.getPadInner = function() {
 padInner = padInner || exports.getPadOuter().find('iframe[name="ace_inner"]').contents();
 return padInner;
}

exports.SCENE_MARK_TYPE = {
  0 : 'withAct',
  1 : 'withAct',
  2 : 'withSeq',
  3 : 'withSeq',
  4 : 'withHeading',
}

var lineIsScriptElement = function(lineNumber){
  var $lines = exports.getPadInner().find("div");
  var $line = $lines.slice(lineNumber, lineNumber + 1);
  var typeOfLine = typeOf($line);

  return _.contains(SE_TAGS_AND_GENERAL, typeOfLine);
}
exports.lineIsScriptElement = lineIsScriptElement;

var typeOf = function($line) {
 var $innerElement = $line.find(LINE_ELEMENTS_SELECTOR);
 var tagName = $innerElement.prop("tagName") || "general"; // general does not have inner tag

 return tagName.toLowerCase();
}
exports.typeOf = typeOf;