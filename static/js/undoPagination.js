var nonSplit = require('ep_script_page_view/static/js/paginationNonSplit');
var split    = require('ep_script_page_view/static/js/paginationSplit');

var utils = require('./utils');

exports.UNDO_FIX_ATTRIB = "lineMightBeAffectedByUndo";
exports.UNDO_FIX_TAG = "line_with_undo_fix";

exports.fix = function(targetLine, isRemovingAttribute, attributeManager) {
  var notFirstLine = targetLine > 0;

  if (isRemovingAttribute) {
    // scenario: target line has a non-split page break and is being changed to general
    if (nonSplit.lineHasPageBreak(targetLine, attributeManager)) {
      markLineAsFixed(targetLine, attributeManager);
    }
    // scenario: target line is first half of split line and is being changed to general
    else if (split.lineHasPageBreak(targetLine, attributeManager)) {
      markLineAsFixed(targetLine, attributeManager);
    }
    // scenario: target line is second half of split line and is being changed to general
    // (in this case we mark previous line -- the one containing the page break)
    else if (notFirstLine && split.lineHasPageBreak(targetLine-1, attributeManager)) {
      markLineAsFixed(targetLine-1, attributeManager);
    }
  } else if (lineIsGeneral(targetLine, attributeManager)) {
    // scenario: target line has a non-split page break and is being changed to non-general
    if (nonSplit.lineHasPageBreak(targetLine, attributeManager)) {
      markLineAsFixed(targetLine, attributeManager);
    }
    // FIXME: regular solution does not work for this scenario
    // scenario: target line is first half of split line and is being changed to non-general
    // else if (split.lineHasPageBreak(targetLine, attributeManager)) {
    //   markLineAsFixed(targetLine, attributeManager);
    // }
  } else if (notFirstLine && lineIsGeneral(targetLine-1, attributeManager)) {
    // scenario: target line is second half of split line and is being changed to non-general
    // (in this case we mark previous line -- the one containing the page break)
    if (split.lineHasPageBreak(targetLine-1, attributeManager)) {
      markLineAsFixed(targetLine-1, attributeManager);
    }
  }
}

var markLineAsFixed = function(targetLine, attributeManager) {
  attributeManager.setAttributeOnLine(targetLine, exports.UNDO_FIX_ATTRIB, true);
}

var lineIsGeneral = function(targetLine, attributeManager) {
  return utils.getLineType(targetLine, attributeManager);
}