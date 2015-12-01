var BACKSPACE = 8;
var DELETE = 46;

describe("ep_script_elements - merge lines", function(){
  var utils;
  //create a new pad before each test run
  beforeEach(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helper.newPad(cb);
    this.timeout(60000);
  });

  context("when element is followed by a different element", function(){

    beforeEach(function(cb) {
      var inner$ = helper.padInner$;
      var $firstTextElement = inner$("div").first();

      // faster way to create two lines (1st is a scene heading, 2nd is an action, 3rd is a parenthetical)
      var firstLine = "<heading>First Line!</heading><br/>";
      var secondLine = "<action>Second Line!</action><br/>";
      var thirdLine = "<parenthetical>Third Line!</parenthetical><br/>";
      $firstTextElement.html(firstLine + secondLine + thirdLine);

      // wait for Etherpad to finish processing lines
      helper.waitFor(function(){
        $ThirdTextElement = inner$("div").first().next().next();
        return $ThirdTextElement.text() === "Third Line!";
      }, 2000).done(cb);
    });

    context("and user presses backspace in the beginning of a line", function(){

      it("does not merge these two lines", function(done){
        var inner$ = helper.padInner$;
        utils.placeCaretInTheBeginningOfLine(1, function(){
          utils.pressKey(BACKSPACE);
          setTimeout(function() {
            var textFirstLine = inner$("div").first().text();
            var textSecondLine = inner$("div").first().next().text();
            expect(textFirstLine).to.be("First Line!");
            expect(textSecondLine).to.be("Second Line!");
            done();
          }, 200);
        });
      });
    });

    context("and user presses delete in the end of a line", function(){

      it("does not merge these two lines", function(done){
        var inner$ = helper.padInner$;
        utils.placeCaretAtTheEndOfLine(1, function(){
          utils.pressKey(DELETE);
          utils.pressKey(DELETE);
          setTimeout(function() {
            var textFirstLine = inner$("div").first().text();
            var textSecondLine = inner$("div").first().next().text();
            expect(textFirstLine).to.be("First Line!");
            expect(textSecondLine).to.be("Second Line!");
            done();
          }, 1000);
        });
      });
    });

    context("and element line is empty", function(){

      beforeEach(function (cb) {
        var inner$ = helper.padInner$;

        // remove content from second line
        var $secondLine = utils.getLine(1).find("action");
        $secondLine.html("<br/>");
        helper.waitFor(function(){
          var $secondLine = inner$("div").first().next();
          return $secondLine.text() === "";
        }).done(cb);
      });

      context("and user presses backspace in the beginning of this line", function(){
        beforeEach(function(cb) {
          utils.placeCaretInTheBeginningOfLine(1, function(){
            utils.pressKey(BACKSPACE);
            cb();
          });
        });

        it("erases the empty line and keeps original line types", function(done){
          var inner$ = helper.padInner$;

          helper.waitFor(function(){
            var $secondLine = inner$("div").first().next();
            return $secondLine.text() === "Third Line!";
          }).done(function() {
            var $originalFirstLine = inner$("div").first();
            var keptTypeOfFirstLine = $originalFirstLine.find("heading").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });

      });

      context("and user presses backspace in the beginning of next line", function(){
        beforeEach(function(cb) {
          utils.placeCaretInTheBeginningOfLine(2, function(){
            utils.pressKey(BACKSPACE);
            cb();
          });
        });

        it("erases the empty line and keeps original line types", function(done){
          var inner$ = helper.padInner$;

          helper.waitFor(function(){
            var $secondLine = inner$("div").first().next();
            return $secondLine.text() === "Third Line!";
          }).done(function() {
            var $originalFirstLine = inner$("div").first();
            var keptTypeOfFirstLine = $originalFirstLine.find("heading").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });

      });

      // these tests are commented because delete key does not work in the test
      // as soon as we find the solution this should be uncommented =)
      // I guess this is an Etherpad limitation we won't be able to workaround
      context("and user presses delete at the end of the previous line", function(){
        beforeEach(function(cb) {
          utils.placeCaretInTheBeginningOfLine(0, function(){
            utils.pressKey(DELETE);
            cb();
          });
        });

        xit("erases the empty line and keeps original line types", function(done){
          var inner$ = helper.padInner$;

          helper.waitFor(function(){
            var $secondLine = inner$("div").first().next();
            return $secondLine.text() === "Third Line!";
          }).done(function() {
            var $originalFirstLine = inner$("div").first();
            var keptTypeOfFirstLine = $originalFirstLine.find("heading").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });
      });
      context("and user presses delete at the end of the this line", function(){
        beforeEach(function(cb) {
          utils.placeCaretInTheBeginningOfLine(1, function(){
            utils.pressKey(DELETE);
            cb();
          });
        });

        xit("erases the empty line and keeps original line types", function(done){
          var inner$ = helper.padInner$;

          helper.waitFor(function(){
            var $secondLine = inner$("div").first().next();
            return $secondLine.text() === "Third Line!";
          }).done(function() {
            var $originalFirstLine = inner$("div").first();
            var keptTypeOfFirstLine = $originalFirstLine.find("heading").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });
      });

    });

  });

});
