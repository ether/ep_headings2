describe("ep_script_elements - element dimensions", function(){
  var utils;

  //use the same pad for all tests
  before(function(cb){
    utils = ep_script_elements_test_helper.utils;
    dimensions = ep_script_elements_test_helper.dimensions;

    helper.newPad(function() {
      utils.cleanPad(function() {
        utils.createScriptWith(dimensions.buildScript(), "last line", cb);
      });
    });
    this.timeout(60000);
  });

  it("displays headings with 61 chars per line", function(done) {
    var elementLine = 0;
    var maxChars = 61;
    dimensions.testElementCanHoldCharsPerLine("heading", elementLine, maxChars, done);
  });

  it("displays actions with 61 chars per line", function(done) {
    var elementLine = 1;
    var maxChars = 61;
    dimensions.testElementCanHoldCharsPerLine("action", elementLine, maxChars, done);
  });

  it("displays characters with 38 chars per line", function(done) {
    var elementLine = 2;
    var maxChars = 38;
    dimensions.testElementCanHoldCharsPerLine("character", elementLine, maxChars, done);
  });

  it("displays parentheticals with 25 chars per line", function(done) {
    var elementLine = 3;
    // parentheticals have a different behavior on tests because the ")" in the end of
    // line is moved to next line when parenthetical reaches the char limit. So instead of
    // testing it with its max (25), we test with max-1
    var maxChars = 24;
    dimensions.testElementCanHoldCharsPerLine("parenthetical", elementLine, maxChars, done);
  });

  it("displays dialogues with 35 chars per line", function(done) {
    var elementLine = 4;
    var maxChars = 35;
    dimensions.testElementCanHoldCharsPerLine("dialogue", elementLine, maxChars, done);
  });

  it("displays shots with 61 chars per line", function(done) {
    var elementLine = 5;
    var maxChars = 61;
    dimensions.testElementCanHoldCharsPerLine("shot", elementLine, maxChars, done);
  });

  it("displays transitions with 16 chars per line", function(done) {
    var elementLine = 6;
    var maxChars = 16;
    dimensions.testElementCanHoldCharsPerLine("transition", elementLine, maxChars, done);
  });

  it("displays generals with 61 chars per line", function(done) {
    var elementLine = 7;
    var maxChars = 61;
    var noInnerTag = true; // general has no <general> tag under <div>
    dimensions.testElementCanHoldCharsPerLine("general", elementLine, maxChars, done, noInnerTag);
  });

});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.dimensions = {
  buildScript: function() {
    var utils = ep_script_elements_test_helper.utils;
    var buildStringWithLength = ep_script_elements_test_helper.dimensions.buildStringWithLength;

    // build elements with their max length
    var heading       = utils.heading("&nbsp;");
    var action        = utils.action("&nbsp;"/*(61)*/);
    var character     = utils.character("&nbsp;"/*(38)*/);
    var parenthetical = utils.parenthetical("&nbsp;"/*(25)*/);
    var dialogue      = utils.dialogue("&nbsp;"/*(35)*/);
    var shot          = utils.shot("&nbsp;"/*(61)*/);
    var transition    = utils.transition("&nbsp;"/*(16)*/);
    // build also a general at the end of script
    var general       = utils.general("last line");

    return heading + action + character + parenthetical + dialogue + shot + transition + general;
  },

  buildStringWithLength: function(length) {
    return ".".repeat(length);
  },

  testElementCanHoldCharsPerLine: function(elementTag, elementLine, maxChars, done, noInnerTag) {
    var inner$ = helper.padInner$;
    var utils = ep_script_elements_test_helper.utils;
    var dimensions = ep_script_elements_test_helper.dimensions;

    // create line text with elementTag as prefix, and "." after it (until the end of line)
    var fullLineText = elementTag + dimensions.buildStringWithLength(maxChars - elementTag.length);

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
  }
}