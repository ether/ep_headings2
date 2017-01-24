var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var utils = require('./utils');
var sceneMarksUtils = require('ep_script_scene_marks/static/js/utils');

var LINE_WITH_CHANGES = 'line_to_be_formatted';

var TOP_SM_TITLE_TO_HEADING_CLASS = {
  'scene_name'    : 'headingWithSynopsis',
  'sequence_name' : 'headingWithSequence',
  'act_name'      : 'headingWithAct',
};

// 'headingWithAct headingWithSequence headingWithSynopsis'
var HEADING_CLASSES_LIST = _.values(TOP_SM_TITLE_TO_HEADING_CLASS).join(' ');

var hasChangesOnSMsAndHeadings = false;

exports.init = function() {
  markHeadingToBeUpdatedWhenItsSceneMarkIsRemoved();
}

var markHeadingToBeUpdatedWhenItsSceneMarkIsRemoved = function() {
  var $editor = utils.getPadInner().find('#innerdocbody');
  $editor.on(sceneMarksUtils.SCENE_MARK_REMOVE_EVENT, function(event, lines) {
    var $lines = utils.getPadInner().find('div');
    for (var i = 0; i < lines.length; i++) {
      var lineNumber = lines[i];
      var $line      = $lines.eq(lineNumber);
      var $heading   = $(getHeadingAssociatedTo($line));

      markLineToBeFormatted($heading);
    }
  });
}

var markLineToBeFormatted = function($line) {
  $line.addClass(LINE_WITH_CHANGES);
  hasChangesOnSMsAndHeadings = true;
}
exports.markLineToBeFormatted = markLineToBeFormatted;

exports.updateHeadingsIfNecessary = function() {
  if (hasChangesOnSMsAndHeadings) {
    var $sceneMarksAndHeadingsWithChanges = utils.getPadInner().find('div.' + LINE_WITH_CHANGES);

    var headingsWithChanges = getHeadingsWithChanges($sceneMarksAndHeadingsWithChanges);

    _.each(headingsWithChanges, function(line) {
      formatHeadingLine(line);
    });

    $sceneMarksAndHeadingsWithChanges.removeClass(LINE_WITH_CHANGES);
    hasChangesOnSMsAndHeadings = false;
  }
}

var getHeadingsWithChanges = function($sceneMarksAndHeadingsWithChanges) {
  // headingsWithChanges will have multiple copies of each heading
  // (one for each SM line of the heading)
  var headingsWithChanges = $sceneMarksAndHeadingsWithChanges.map(function() {
    return getHeadingAssociatedTo($(this));
  });
  var headingsListIsSorted = true;
  var uniqueHeadingsWithChanges = _.unique(headingsWithChanges, headingsListIsSorted);

  return uniqueHeadingsWithChanges;
}

var getHeadingAssociatedTo = function($line) {
  var $lineWithHeading = $line;

  if (!$line.hasClass('withHeading')) {
    // $line is not a heading, so find the associated heading below it
    var $lastSMBelowCurrentLine = $lineWithHeading.nextUntil('.withHeading').last();
    $lineWithHeading = $lastSMBelowCurrentLine.next();
  }

  return $lineWithHeading.get(0);
}

var formatHeadingLine = function(line) {
  var $line = $(line);

  // clean old values first
  $line.removeClass(HEADING_CLASSES_LIST);

  var cls = getHeadingClass($line);
  $line.addClass(cls);
}

var getHeadingClass = function($lineWithHeading) {
  var $sceneMarksAboveLine = $lineWithHeading.prevUntil('div:not(.sceneMark)').addBack();
  var $titleOfFirstSMOfHeading = $sceneMarksAboveLine.first().find(sceneMarksUtils.SCENE_MARK_TITLES_SELECTOR);

  var sceneMarkTitle = $titleOfFirstSMOfHeading.get(0).localName;
  var cls = TOP_SM_TITLE_TO_HEADING_CLASS[sceneMarkTitle];

  return cls;
}
