// Based on fixSamllZooms.js of ep_script_page_view

// This feature is needed because small zooms (<= 67%) do not scale font size the same way it
// scales other elements on the page. This causes a page to fit more than the allowed chars/line on
// elements that have left and/or right margin (character, dialogue, parenthetical, and transition)

var _ = require('ep_etherpad-lite/static/js/underscore');
var utils = require("./utils");

// this was calculated using 100% zoom on Chrome
var DEFAULT_CHAR_WIDTH = 7.2;
var DEFAULT_LINE_HEIGHT = 16.0;

var ELEMENTS_WITH_MARGINS = [
  "act_name",
  "sequence_name",
  "heading",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
];

var DEFAULT_MARGINS = {
  // these values were originally set on CSS
  "act_name":      { vertical: { top: 2*DEFAULT_LINE_HEIGHT } },
  "sequence_name": { vertical: { top: 2*DEFAULT_LINE_HEIGHT } },
  "heading":       { vertical: { top: 2*DEFAULT_LINE_HEIGHT } },
  "shot":          { vertical: { top: 2*DEFAULT_LINE_HEIGHT } },
  "action":        { vertical: { top: 1*DEFAULT_LINE_HEIGHT } },
  "character":     { vertical: { top: 1*DEFAULT_LINE_HEIGHT },
                     horizontal: { left: 152, right: 16  } },
  "transition":    { vertical: { top: 1*DEFAULT_LINE_HEIGHT },
                     horizontal: { left: 290, right: 36  } },
  "parenthetical": { horizontal: { left: 105, right: 154 } },
  "dialogue":      { horizontal: { left: 77,  right: 111 } },
};
exports.DEFAULT_MARGINS = DEFAULT_MARGINS;

// if heading is the 1st element on pad, it won't have a top margin
var HEADING_IS_FIRST_ELEMENT     = 'div:first-of-type.withAct ~ div.withHeading ~ div.withHeading ';
// if heading is not the 1st element on pad, it will only have a top margin if its sequence is not
// visible
var HEADING_IS_NOT_FIRST_ELEMENT_AND_HAS_NO_SEQ = 'div:first-of-type:not(.withAct) ~ div:not(.withSeq) + div.withHeading ';
var HEADING_IS_NOT_FIRST_ELEMENT_AND_HAS_SEQ    = 'div:first-of-type:not(.withAct) ~ div.withSeq.hidden + div.withHeading ';

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
  var newVerticalProportion = calculateVerticalProportion();
  var newHorizontalProportion = calculateHorizontalProportion();

  var elementStyles = _.map(ELEMENTS_WITH_MARGINS, function(elementName) {
    var elementStyle = getNewStyleForElement(elementName, newHorizontalProportion, newVerticalProportion);
    elementStyle = adjustStylesToNotHaveTopMarginOnFirstLine(elementName, elementStyle);
    return elementStyle;
  }).join("\n");

  // we don't want to affect mobile screens
  var style = "@media (min-width : 464px) { " + elementStyles + " }";

  // overwrite current style for element margins
  utils.getPadInner().find("head").append("<style>" + style + "</style>");
}

var calculateVerticalProportion = function() {
  var oneLineHeight = getHeightOfOneLine();
  var charProportion = oneLineHeight / DEFAULT_LINE_HEIGHT;

  return charProportion;
}

var calculateHorizontalProportion = function() {
  var oneCharWidth = getWidthOfOneChar();
  var charProportion = oneCharWidth / DEFAULT_CHAR_WIDTH;

  return charProportion;
}

var getNewStyleForElement = function(elementName, horizontalProportion, verticalProportion) {
  var defaultMargins = DEFAULT_MARGINS[elementName];

  var marginLeft  = getMarginStyle("left" , defaultMargins.horizontal, horizontalProportion);
  var marginRight = getMarginStyle("right", defaultMargins.horizontal, horizontalProportion);
  var marginTop   = getMarginStyle("top"  , defaultMargins.vertical  , verticalProportion);

  var elementStyle = elementName + " { " + marginLeft + marginRight + marginTop + " }";

  return elementStyle;
}

var getMarginStyle = function(marginName, defaultValues, proportion) {
  // if there's no default value, return an empty string
  var marginStyle = "";

  if (defaultValues && defaultValues[marginName]) {
    var newMargingValue = proportion * defaultValues[marginName];
    marginStyle = "margin-" + marginName + ": " + newMargingValue + "px; ";
  }

  return marginStyle;
}

var adjustStylesToNotHaveTopMarginOnFirstLine = function(elementName, elementStyle) {
  var adjustedStyle = elementStyle;

  // first heading is not on first div; it has an act + seq before, so we need a special CSS rule
  if (elementName === 'heading') {
    adjustedStyle = HEADING_IS_NOT_FIRST_ELEMENT_AND_HAS_NO_SEQ + elementStyle;
    adjustedStyle += HEADING_IS_NOT_FIRST_ELEMENT_AND_HAS_SEQ + elementStyle;
    adjustedStyle += HEADING_IS_FIRST_ELEMENT + elementStyle;
  }

  return adjustedStyle;
}

var getWidthOfOneChar = function() {
  return utils.getPadOuter().find("#linemetricsdiv").get(0).getBoundingClientRect().width;
}

var getHeightOfOneLine = function() {
  return utils.getPadOuter().find("#linemetricsdiv").get(0).getBoundingClientRect().height;
}
