var _     = require('ep_etherpad-lite/static/js/underscore');
var utils = require("./utils");

var removeAndProcessSelection = function(context, beginningOfSelection, endOfSelection, shouldCreateNewLine, lineToSetAttributes, shouldRecoverAttribsOfLastLineSelected){
  var editorInfo = context.editorInfo;
  var rep = context.rep;
  var attributeManager = context.documentAttributeManager;
  var lastLineAttribs = "";

  // recover attribs of last line before removing it
  if(shouldRecoverAttribsOfLastLineSelected){
    var lastLineSelected = endOfSelection[0];
    lastLineAttribs = getAttributesOfLine(lastLineSelected, attributeManager);
  }

  // remove selection
  removeSelection(beginningOfSelection, endOfSelection, editorInfo);

  // create new line if necessary
  if(shouldCreateNewLine){
    createANewLine(editorInfo)
  }

  // only set attrib in the lineToSetAttributes if shouldRecoverAttribsOfLastLineSelected is true
  // and there is  attrib to apply (e.g. a general)
  if(lastLineAttribs !== ""){
    setAttributesOnLine(lastLineAttribs, lineToSetAttributes, attributeManager, editorInfo);
  }
}
exports.removeAndProcessSelection = removeAndProcessSelection;

var getAttributesOfLine = function(line, attributeManager){
  var allLineAttribsOfLine = attributeManager.getAttributesOnLine(line);
  var lineAttribsOfLine = _.reject(allLineAttribsOfLine, function(attrib) {
    var attribName = attrib[0];
    var isDefaultAttrib = utils.DEFAULT_LINE_ATTRIBS.indexOf(attribName) !== -1;
    return isDefaultAttrib;
  });

  return lineAttribsOfLine;
}

var removeSelection = function(beginningOfSelection, endOfSelection, editorInfo){
  editorInfo.ace_performDocumentReplaceRange(beginningOfSelection, endOfSelection, '');
  placeCaretOnLine(editorInfo, beginningOfSelection);
}

var createANewLine = function(editorInfo){
  return editorInfo.ace_doReturnKey();
}

var setAttributesOnLine = function(attribs, line, attributeManager){
  attributeManager.removeAttributeOnLine(line, 'script_element');
  attribs.forEach(function(attrib) {
    var attribName = attrib[0];
    var attribValue = attrib[1];

    attributeManager.setAttributeOnLine(line, attribName, attribValue);
  });
}

var placeCaretOnLine = function(editorInfo, linePosition){
  editorInfo.ace_inCallStackIfNecessary("placeCaretAfterRemoveSelection", function(){

    editorInfo.ace_performSelectionChange(linePosition, linePosition, true);
    editorInfo.ace_updateBrowserSelectionFromRep();
  })
}