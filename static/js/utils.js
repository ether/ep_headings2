var _                        = require('ep_etherpad-lite/static/js/underscore');
var actTags                  = ["act_name", "act_summary"];
var sequenceTags             = ["sequence_name", "sequence_summary"];
var dramaticUnitTags         = ["dramatic_unit_name", "dramatic_unit_summary", "dramatic_unit_tone", "dramatic_unit_cadence", "dramatic_unit_subtext"];
var SCRIPT_ELEMENTS_SELECTOR = require('./shared').tags;
var SCENE_MARK_SELECTOR      = require("ep_script_scene_marks/static/js/shared").sceneMarkTags;
var LINE_ELEMENTS_SELECTOR   = _.union(SCRIPT_ELEMENTS_SELECTOR, SCENE_MARK_SELECTOR).join(", ");
var SE_TAGS_AND_GENERAL      = _.union(SCRIPT_ELEMENTS_SELECTOR, ["general"]);
exports.sceneMarkTags        = _.union(actTags, sequenceTags, dramaticUnitTags);
exports.DEFAULT_LINE_ATTRIBS = ['author', 'lmkr', 'insertorder', 'start'];
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
  4 : 'withDU',
  5 : 'withDU',
  6 : 'withDU',
  7 : 'withDU',
  8 : 'withDU',
  9 : 'withHeading',
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