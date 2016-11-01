describe("ep_script_elements - element dimensions", function(){
  var utils, dimensions;

  before(function() {
    utils      = ep_script_elements_test_helper.utils;
    dimensions = ep_script_elements_test_helper.dimensions;
  });

  context('vertical margins', function() {
    //use the same pad for all tests
    before(function(done) {
      helper.newPad(done);
      this.timeout(60000);
    });

    it('displays actions with no top margin on first line, but with margin on the others', function(done) {
      var hasTopMarginOnOtherLines = true;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.action, 'action', hasTopMarginOnOtherLines, done);
    });

    it('displays characters with no top margin on first line, but with margin on the others', function(done) {
      var hasTopMarginOnOtherLines = true;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.character, 'character', hasTopMarginOnOtherLines, done);
    });

    it('displays parentheticals with no top margin on first line, nor on the others', function(done) {
      var hasTopMarginOnOtherLines = false;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.parenthetical, 'parenthetical', hasTopMarginOnOtherLines, done);
    });

    it('displays dialogues with no top margin on first line, nor on the others', function(done) {
      var hasTopMarginOnOtherLines = false;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.dialogue, 'dialogue', hasTopMarginOnOtherLines, done);
    });

    it('displays shots with no top margin on first line, but with margin on the others', function(done) {
      var hasTopMarginOnOtherLines = true;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.shot, 'shot', hasTopMarginOnOtherLines, done);
    });

    it('displays transitions with no top margin on first line, but with margin on the others', function(done) {
      var hasTopMarginOnOtherLines = true;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.transition, 'transition', hasTopMarginOnOtherLines, done);
    });

    it('displays generals with no top margin on first line, nor on the others', function(done) {
      var hasTopMarginOnOtherLines = false;
      var hasInnerTag = false;
      dimensions.testElementHasNoTopMarginOnFirstLine(this, utils.general, hasInnerTag, hasTopMarginOnOtherLines, done);
    });

    // headings have a different behavior on top of pages when they have an act and/or a sequence,
    // so we handle these scenarios on ep_script_scene_marks
  });

  context('horizontal margins', function() {
    //use the same pad for all tests
    before(function(done) {
      helper.newPad(function() {
        utils.cleanPad(function() {
          utils.createScriptWith(dimensions.buildScript(), "last line", done);
        });
      });
      this.timeout(60000);
    });

    it("displays headings with 61 chars per line", function(done) {
      var elementLine = 2;
      var maxChars = 61;
      dimensions.testElementCanHoldCharsPerLine("heading", elementLine, maxChars, done);
    });

    it("displays actions with 61 chars per line", function(done) {
      var elementLine = 3;
      var maxChars = 61;
      dimensions.testElementCanHoldCharsPerLine("action", elementLine, maxChars, done);
    });

    it("displays characters with 38 chars per line", function(done) {
      var elementLine = 4;
      var maxChars = 38;
      dimensions.testElementCanHoldCharsPerLine("character", elementLine, maxChars, done);
    });

    it("displays parentheticals with 25 chars per line", function(done) {
      var elementLine = 5;
      // parentheticals have a different behavior on tests because the ")" in the end of
      // line is moved to next line when parenthetical reaches the char limit. So instead of
      // testing it with its max (25), we test with max-1
      var maxChars = 24;
      dimensions.testElementCanHoldCharsPerLine("parenthetical", elementLine, maxChars, done);
    });

    it("displays dialogues with 35 chars per line", function(done) {
      var elementLine = 6;
      var maxChars = 35;
      dimensions.testElementCanHoldCharsPerLine("dialogue", elementLine, maxChars, done);
    });

    it("displays shots with 61 chars per line", function(done) {
      var elementLine = 7;
      var maxChars = 61;
      dimensions.testElementCanHoldCharsPerLine("shot", elementLine, maxChars, done);
    });

    it("displays transitions with 16 chars per line", function(done) {
      var elementLine = 8;
      var maxChars = 16;
      dimensions.testElementCanHoldCharsPerLine("transition", elementLine, maxChars, done);
    });

    it("displays generals with 61 chars per line", function(done) {
      var elementLine = 9;
      var maxChars = 61;
      var noInnerTag = true; // general has no <general> tag under <div>
      dimensions.testElementCanHoldCharsPerLine("general", elementLine, maxChars, done, noInnerTag);
    });
  });

});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.dimensions = {
  buildScript: function() {
    var utils = ep_script_elements_test_helper.utils;

    var synopsis      = utils.synopsis("&nbsp;");
    var heading       = utils.heading("&nbsp;");
    var action        = utils.action("&nbsp;");
    var character     = utils.character("&nbsp;");
    var parenthetical = utils.parenthetical("&nbsp;");
    var dialogue      = utils.dialogue("&nbsp;");
    var shot          = utils.shot("&nbsp;");
    var transition    = utils.transition("&nbsp;");
    var general       = utils.general("last line");

    return synopsis + heading + action + character +
      parenthetical + dialogue + shot + transition + general;
  },

  buildStringWithLength: function(length) {
    return ".".repeat(length);
  },

  testElementCanHoldCharsPerLine: function(elementTag, elementLine, maxChars, done, noInnerTag) {
    var utils = ep_script_elements_test_helper.utils;

    // create line text with elementTag as prefix, and "." after it (until the end of line)
    var fullLineText = elementTag + this.buildStringWithLength(maxChars - elementTag.length);

    // get original height
    var $line = utils.getLine(elementLine);
    var $element = noInnerTag ? $line : $line.find(elementTag);
    var previousHeight = $element.height();

    // insert maxChars and verify line height did not change
    $element.sendkeys('{selectall}');
    $element.sendkeys(fullLineText);
    var $element = utils.getLine(elementLine);
    expect($element.height()).to.be(previousHeight);

    // add one char and verify if it has one more line now
    $element.sendkeys('X');
    var $element = utils.getLine(elementLine);
    expect($element.height()).to.be.greaterThan(previousHeight);

    done();
  },

  testElementHasNoTopMarginOnFirstLine: function(test, buildLine, elementTag, hasTopMarginOnOtherLines, done) {
    var inner$ = helper.padInner$;
    var utils = ep_script_elements_test_helper.utils;

    test.timeout(4000);

    utils.cleanPad(function() {
      // change first line to target type
      var $firstLine = utils.getLine(0);
      $firstLine.html(buildLine('line WITHOUT top margin'));

      // test 1st line has no top margin
      var $targetElement = elementTag ? $firstLine.find(elementTag) : $firstLine;
      expect($targetElement.css('margin-top')).to.be('0px');

      // create a second line to test it has the regular margin top
      $firstLine.html($firstLine.html() + buildLine('regular line'));

      helper.waitFor(function() {
        // wait for lines to be split
        var $secondLine = utils.getLine(1);
        return utils.cleanText($secondLine.text()) === 'regular line';
      }, 2000).done(function() {
        // also test other lines of same type has top margin
        var $secondLine = utils.getLine(1);
        var $targetElement = elementTag ? $secondLine.find(elementTag) : $secondLine;
        if (hasTopMarginOnOtherLines) {
          expect($targetElement.css('margin-top')).not.to.be('0px');
        } else {
          expect($targetElement.css('margin-top')).to.be('0px');
        }
        done();
      });
    });
  },
}