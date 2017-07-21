var _ = require('ep_etherpad-lite/static/js/underscore');
var utils          = require('./utils');
var api            = require('./api');

exports.sendMessageCaretElementChanged = function (context) {
  var rep              = context.rep;
  var attributeManager = context.documentAttributeManager;
  var sameElementOnSelection = isSameElementOnSelection(rep, attributeManager);
  var elementOfCurrentLine;
  var currentLine = rep.selStart[0];
  var isLineScriptElement = utils.lineIsScriptElement(currentLine);
  if (sameElementOnSelection && isLineScriptElement) {
    elementOfCurrentLine = utils.getLineType(currentLine, attributeManager) || 'general';
  }
  api.triggerCaretElementChanged(elementOfCurrentLine);
}

var isSameElementOnSelection = function(rep, attributeManager) {
  var firstLine = rep.selStart[0];
  var isSameElement = true;
  var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  //get the first attribute on the selection
  var firstAttribute = utils.getLineType(firstLine, attributeManager);
  //check if the first attribute on selection is present in all lines
  _(_.range(firstLine + 1, lastLine + 1)).each(function(line) {
    var attributeOnline = utils.getLineType(line, attributeManager);
    if (attributeOnline !== firstAttribute) {
      isSameElement = false;
      return;
    }
  });
  return isSameElement;
}
