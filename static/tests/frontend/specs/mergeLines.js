var BACKSPACE = 8;
var DELETE = 46;

describe("ep_script_elements - merge lines", function(){
  var utils;
  //create a new pad before each test run
  beforeEach(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helper.newPad(function() {
      ep_script_elements_test_helper.mergeLines.createScriptWithThreeDifferentElements(cb);
    });
    this.timeout(60000);
  });

  context("when element is the first of pad and user presses backspace in the beginning of line", function() {
    beforeEach(function(cb) {
      utils.placeCaretInTheBeginningOfLine(0, function(){
        utils.pressKey(BACKSPACE);

        cb();
      });
    });

    it("does nothing", function(done) {
      var inner$ = helper.padInner$;
      setTimeout(function() {
        var $firstLine = inner$("div").first();
        var $secondLine = $firstLine.next();
        var $thirdLine = $secondLine.next();
        expect($firstLine.text()).to.be("First Line!");
        expect($secondLine.text()).to.be("Second Line!");
        expect($thirdLine.text()).to.be("Third Line!");

        done();
      }, 1000);
    });
  });

  context("when element is the last of pad and user presses delete in the end of line", function() {
    beforeEach(function(cb) {
      utils.placeCaretAtTheEndOfLine(2, function(){
        // apparently first DELETE is ignored
        utils.pressKey(DELETE);
        utils.pressKey(DELETE);

        cb();
      });
    });

    it("does nothing", function(done) {
      var inner$ = helper.padInner$;
      setTimeout(function() {
        var $firstLine = inner$("div").first();
        var $secondLine = $firstLine.next();
        var $thirdLine = $secondLine.next();
        expect($firstLine.text()).to.be("First Line!");
        expect($secondLine.text()).to.be("Second Line!");
        expect($thirdLine.text()).to.be("Third Line!");

        done();
      }, 1000);
    });
  });

  context("when element is followed by a different element", function(){
    context("and user presses backspace in the beginning of a line", function(){

      it("does not merge these two lines", function(done){
        var inner$ = helper.padInner$;
        utils.placeCaretInTheBeginningOfLine(1, function(){
          utils.pressKey(BACKSPACE);
          setTimeout(function() {
            var $firstLine = inner$("div").first();
            var $secondLine = $firstLine.next();
            expect($firstLine.text()).to.be("First Line!");
            expect($secondLine.text()).to.be("Second Line!");

            done();
          }, 200);
        });
      });
    });

    context("and user presses delete in the end of a line", function(){

      it("does not merge these two lines", function(done){
        var inner$ = helper.padInner$;
        utils.placeCaretAtTheEndOfLine(1, function(){
          // apparently first DELETE is ignored
          utils.pressKey(DELETE);
          utils.pressKey(DELETE);

          setTimeout(function() {
            var $secondLine = inner$("div").first().next();
            var $thirdLine = $secondLine.next();
            expect($secondLine.text()).to.be("Second Line!");
            expect($thirdLine.text()).to.be("Third Line!");

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
            var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
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
            var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });

        context("then user presses UNDO", function(){
          beforeEach(function(cb) {
            var chrome$ = helper.padChrome$;
            var inner$ = helper.padInner$;

            helper.waitFor(function(){
              var $secondLine = inner$("div").first().next();
              return $secondLine.text() === "Third Line!";
            }).done(function() {
              var $undoButton = chrome$(".buttonicon-undo");
              $undoButton.click();

              cb();
            });
          });

          it("moves line down again and keeps original line types", function(done){
            var inner$ = helper.padInner$;

            // wait for line to be moved down again
            helper.waitFor(function(){
              var $thirdLine = inner$("div").first().next().next();
              return $thirdLine.text() === "Third Line!";
            }).done(function() {
              var $originalFirstLine = inner$("div").first();
              var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
              expect(keptTypeOfFirstLine).to.be(true);

              var $originalSecondLine = inner$("div").first().next();
              var keptTypeOfSecondLine = $originalSecondLine.find("action").length > 0;
              expect(keptTypeOfSecondLine).to.be(true);

              var $originalThirdLine = inner$("div").first().next().next();
              var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
              expect(keptTypeOfThirdLine).to.be(true);

              done();
            });
          });
        });
      });

      context("and user presses delete at the end of the previous line", function(){
        beforeEach(function(cb) {
          utils.placeCaretAtTheEndOfLine(0, function(){
            utils.pressKey(DELETE);
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
            var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });

        context("then user presses UNDO", function(){
          beforeEach(function(cb) {
            var chrome$ = helper.padChrome$;
            var inner$ = helper.padInner$;

            helper.waitFor(function(){
              var $secondLine = inner$("div").first().next();
              return $secondLine.text() === "Third Line!";
            }).done(function() {
              var $undoButton = chrome$(".buttonicon-undo");
              $undoButton.click();

              cb();
            });
          });

          it("moves line down again and keeps original line types", function(done){
            var inner$ = helper.padInner$;

            // wait for line to be moved down again
            helper.waitFor(function(){
              var $thirdLine = inner$("div").first().next().next();
              return $thirdLine.text() === "Third Line!";
            }).done(function() {
              var $originalFirstLine = inner$("div").first();
              var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
              expect(keptTypeOfFirstLine).to.be(true);

              var $originalSecondLine = inner$("div").first().next();
              var keptTypeOfSecondLine = $originalSecondLine.find("action").length > 0;
              expect(keptTypeOfSecondLine).to.be(true);

              var $originalThirdLine = inner$("div").first().next().next();
              var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
              expect(keptTypeOfThirdLine).to.be(true);

              done();
            });
          });
        });
      });

      context("and user presses delete at the end of the this line", function(){
        beforeEach(function(cb) {
          utils.placeCaretAtTheEndOfLine(1, function(){
            // apparently first DELETE is ignored
            utils.pressKey(DELETE);
            utils.pressKey(DELETE);
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
            var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
            expect(keptTypeOfFirstLine).to.be(true);

            var $originalThirdLine = inner$("div").first().next();
            var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
            expect(keptTypeOfThirdLine).to.be(true);

            done();
          });
        });

        context("then user presses UNDO", function(){
          beforeEach(function(cb) {
            var chrome$ = helper.padChrome$;
            var inner$ = helper.padInner$;

            helper.waitFor(function(){
              var $secondLine = inner$("div").first().next();
              return $secondLine.text() === "Third Line!";
            }).done(function() {
              var $undoButton = chrome$(".buttonicon-undo");
              $undoButton.click();

              cb();
            });
          });

          it("moves line down again and keeps original line types", function(done){
            var inner$ = helper.padInner$;

            // wait for line to be moved down again
            helper.waitFor(function(){
              var $thirdLine = inner$("div").first().next().next();
              return $thirdLine.text() === "Third Line!";
            }).done(function() {
              var $originalFirstLine = inner$("div").first();
              var keptTypeOfFirstLine = $originalFirstLine.find("shot").length > 0;
              expect(keptTypeOfFirstLine).to.be(true);

              var $originalSecondLine = inner$("div").first().next();
              var keptTypeOfSecondLine = $originalSecondLine.find("action").length > 0;
              expect(keptTypeOfSecondLine).to.be(true);

              var $originalThirdLine = inner$("div").first().next().next();
              var keptTypeOfThirdLine = $originalThirdLine.find("parenthetical").length > 0;
              expect(keptTypeOfThirdLine).to.be(true);

              done();
            });
          });
        });
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.mergeLines = {
  createScriptWithThreeDifferentElements: function(cb) {
    var utils = ep_script_elements_test_helper.utils;

    var shot          = utils.shot("First Line!");
    var action        = utils.action("Second Line!");
    var parenthetical = utils.parenthetical("Third Line!");
    var script        = shot + action + parenthetical;

    utils.createScriptWith(script, "Third Line!", cb);
  },
}
