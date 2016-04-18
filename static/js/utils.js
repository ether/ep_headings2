var actTags          = ["act_name", "act_summary"];
var sequenceTags     = ["sequence_name", "sequence_summary"];
var dramaticUnitTags = ["dramatic_unit_name", "dramatic_unit_summary", "dramatic_unit_tone", "dramatic_unit_cadence", "dramatic_unit_subtext"];
exports.sceneMarkTags = _.union(actTags, sequenceTags, dramaticUnitTags);

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