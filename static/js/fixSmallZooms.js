// Based on fixSamllZooms.js of ep_script_page_view

// This feature is needed because small zooms (<= 67%) do not scale font size the same way it
// scales other elements on the page. This causes a page to fit more than the allowed chars/line on
// elements that have left and/or right margin (character, dialogue, parenthetical, and transition)

var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require("./utils");

var ELEMENTS_WITH_MARGINS = [
  "character",
  "parenthetical",
  "dialogue",
  "transition",
];

var DEFAULT_MARGINS = {
  // these values were originally set on CSS
  "character":     { left: 152, right: 16 },
  "parenthetical": { left: 105, right: 154 },
  "dialogue":      { left: 77,  right: 111 },
  "transition":    { left: 291, right: 36 },
};
exports.DEFAULT_MARGINS = DEFAULT_MARGINS;

var DEFAULT_CHAR_WIDTH = 7.2; // this was calculated using 100% zoom on Chrome

exports.init = function() {
  waitForResizeToFinishThenCall(function() {
    updateMargins();
  });

  updateMargins();
}

var waitForResizeToFinishThenCall = function(callback) {
  var resizeTimer;
  var timeout = 200;
  $(window).on("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(callback, timeout);
  });
}

var updateMargins = function() {
  // Use char proportion to find how to adjust margins
  var newCharProportion = calculateMarginProportion();

  var elementStyles = _.map(ELEMENTS_WITH_MARGINS, function(elementName) {
    return getNewStyleForElement(elementName, newCharProportion);
  }).join("\n");

  // we don't want to affect mobile screens
  var style = "@media (min-width : 464px) { " + elementStyles + " }";

  // overwrite current style for element margins
  utils.getPadInner().find("head").append("<style>" + style + "</style>");
}

var calculateMarginProportion = function() {
  var oneCharWidth = getWidthOfOneChar();
  var charProportion = oneCharWidth / DEFAULT_CHAR_WIDTH;

  return charProportion;
}

var getNewStyleForElement = function(elementName, charProportion) {
  var defaultMargins = DEFAULT_MARGINS[elementName];
  var marginLeft = charProportion * defaultMargins.left;
  var marginRight = charProportion * defaultMargins.right;

  // this was moved from CSS file to here, so it can have a dynamic value
  var marginLeftStyle = "margin-left: " + marginLeft + "px;";
  var marginRightStyle = "margin-right: " + marginRight + "px;";
  var elementStyle = elementName + " { " + marginLeftStyle + marginRightStyle + " }";

  return elementStyle;
}

var getWidthOfOneChar = function() {
  return utils.getPadOuter().find("#linemetricsdiv").get(0).getBoundingClientRect().width;
}
