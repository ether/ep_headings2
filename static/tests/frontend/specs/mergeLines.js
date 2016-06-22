var BACKSPACE = 8;
var DELETE = 46;

describe("ep_script_elements - merge lines", function(){
  var utils, helperFunctions;
  var offsetAtFirstElement = 0;
  var offsetLastLineSelection = 0;

  //create a new pad before each test run
  beforeEach(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.mergeLines;
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

  context("when element is a heading preceded by a sequence summary empty", function(){

    beforeEach(function(cb){
      utils.cleanPad(function(){
        ep_script_elements_test_helper.mergeLines.createScriptWithHeadingAndSceneMark(cb);
      });
    });

    context("and it presses backspace in the beginning of heading line", function(){

      beforeEach(function(cb){
        utils.placeCaretInTheBeginningOfLine(5, function(){
          utils.pressKey(BACKSPACE);
          cb();
        });
      });

      // it doesn't test if it has a heading because, it can go to inside the upper tag
      it("does nothing", function(done){

        setTimeout(function() {
          var inner$ = helper.padInner$;
          var linesLength = inner$("div").length;
          var sequenceSummaryText = inner$("sequence_summary").text();

          expect(linesLength).to.be(7);
          expect(utils.cleanText(sequenceSummaryText)).to.be(" ");

          done();
        }, 1000);
      });

    })

  });

  context("when it has a selection wrapping more than one line", function(){

    beforeEach(function(done){
      // make the selection
      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(shot)').first();
      var $lastElement = $firstElement.nextUntil('div:has(parenthetical)').next();

      // the original text of first line is 'first line!'
      // var offsetAtFirstElement ||= 0;

      // the original text of last line is 'third line!'
      var lastLineLength = $lastElement.text().length;
      var offsetAtlastElement = lastLineLength - offsetLastLineSelection;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // remove the text
      utils.pressKey(BACKSPACE);
      done();
    });

    context("and the first and last line of selection are partially selected and user removes selection", function(){

      before(function(){
        offsetAtFirstElement = 3;
        offsetLastLineSelection = 8;
      });


      it("removes the lines between", function(done){
        helperFunctions.checkNumberOfLine(2);
        done();
      });

      it("keeps the original element of lines", function(done){
        var firstElement = "shot";
        var firstElementText = "Fir";
        var lastElementText = "rd Line!"
        var lastElement =  "parenthetical"
        utils.validateLineTextAndType(0, firstElementText, firstElement);
        utils.validateLineTextAndType(1, lastElementText, lastElement)
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    });

    context("and first line of selection is completely selected and last one is partially selected and user removes selection", function(){

      before(function(){
        offsetAtFirstElement = 0;
        offsetLastLineSelection = 8;
      });

      it("removes the lines", function(done){
        helperFunctions.checkNumberOfLine(1);
        done();
      });

      it("keeps the last line type and part of the text", function(done){
        var elementText = "rd Line!"
        var element =  "parenthetical"
        utils.validateLineTextAndType(0, elementText, element);
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    });

    context("and first line of selection is partially selected and last one is completely selected and user removes selection", function(){
      before(function(){
        offsetAtFirstElement = 3;
        offsetLastLineSelection = 0;
      });

      it("removes the lines", function(done){
        helperFunctions.checkNumberOfLine(1);
        done();
      });

      it("keeps the first line type and part of the text", function(done){
        var elementText = "Fir"
        var element =  "shot"
        utils.validateLineTextAndType(0, elementText, element);
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    });

    context("and first and last line is completely selected", function(){

      before(function(){
        offsetAtFirstElement = 0;
      });

      it("removes the lines between", function(done){
        helperFunctions.checkNumberOfLine(1);
        done();
      });

      it("keeps the original element of lines", function(done){
        var firstElement = "shot";
        var firstElementText = "";
        utils.validateLineTextAndType(0, firstElementText, firstElement);
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });

    });
  });

  context("when line is selected until the line break and user removes selection", function(){

    beforeEach(function(done){
      // make the selection
      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(shot)').first();
      var $lastElement = inner$('div:has(action)').first();

      var offsetAtFirstElement = 0;
      var offsetAtlastElement = 0;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);
      done();
    });

    context("and user removes selection", function(){
      beforeEach(function(done){
        // remove the text
        utils.pressKey(BACKSPACE);
        done();
      });

      it("removes only the line selected", function(done){
        var firstElementText = "Second Line!";
        var secondElementText = "Third Line!";
        var firstElement = "action";
        var secondElement = "parenthetical";
        utils.validateLineTextAndType(0, firstElementText, firstElement);
        utils.validateLineTextAndType(1, secondElementText, secondElement);
        done();
      });

      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("keeps the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    });
  });

  context("when script element is followed by an empty scene marks", function(){
    beforeEach(function(cb){
      utils.cleanPad(function(){
        ep_script_elements_test_helper.mergeLines.createScriptWithHeadingAndSceneMark(cb);
      });
    });
    context("and it presses delete at the end of line of the script element", function(){
      beforeEach(function(cb){
        utils.placeCaretAtTheEndOfLine(0, function(){
          utils.pressKey(DELETE);
          cb();
        });
      });

      it("does nothing", function(done){
        this.timeout(5000);
        setTimeout(function() {
          var inner$ = helper.padInner$;
          var hasActName         = inner$("act_name").length !== 0;
          var hasActSummary      = inner$("act_summary").length !== 0;
          var hasSequenceName    = inner$("sequence_name").length !== 0;
          var hasSequenceSummary = inner$("sequence_summary").length !== 0;

          expect(hasActName).to.be(true);
          expect(hasActSummary).to.be(true);
          expect(hasSequenceName).to.be(true);
          expect(hasSequenceSummary).to.be(true);
          done();
          // we have to wait 3s to avoid false positives
        }, 3000);
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
  // we only create a heading, the rest is created automatically
  // we need to use an empty act, to test the merge of delete
  createScriptWithHeadingAndSceneMark: function(cb){
    var utils = ep_script_elements_test_helper.utils;
    var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

    var dialogue = utils.dialogue("dialogue");
    var act      = sceneMarkUtils.emptyAct();
    var sequence = sceneMarkUtils.emptySequence();
    var heading  = utils.heading("Heading");
    var action   = utils.action("action");
    var script   = dialogue + act + sequence + heading + action;

    utils.createScriptWith(script, "action", function(){
      sceneMarkUtils.clickOnSceneMarkButtonOfLine(4);
      cb();
    });
  },
  checkNumberOfLine: function(numberOfLines){
    var inner$ = helper.padInner$;
    var linesLength = inner$("div").length;
    expect(linesLength).to.equal(numberOfLines);
  },
  checkIfItHasTheOriginalText: function(done){
    var utils = ep_script_elements_test_helper.utils;
    var firstElementText = "First Line!";
    var secondElementText = "Second Line!";
    var thirdElementText = "Third Line!";
    var firstElement = "shot";
    var secondElement = "action";
    var thirdElement = "parenthetical";
    utils.validateLineTextAndType(0, firstElementText, firstElement);
    utils.validateLineTextAndType(1, secondElementText, secondElement);
    utils.validateLineTextAndType(2, thirdElementText, thirdElement);
    done();
  },
}
