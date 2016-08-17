var BACKSPACE = 8;
var DELETE = 46;

describe("ep_script_elements - merge lines", function(){
  var utils, helperFunctions;

  before(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.mergeLines;
    helper.newPad(function() {
      ep_script_elements_test_helper.mergeLines.createScriptWithThreeDifferentElements(cb);
    });
    this.timeout(60000);
  });

  context('when element is the first of pad and user presses backspace in the beginning of line', function() {
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

  context('when element is the last of pad and user presses delete in the end of line', function() {
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

  context('when element is followed by a different element', function(){
    context("and target line is not empty and user presses backspace in the beginning of it", function(){

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

    context("and target line is not empty and user presses delete in the end of it", function(){

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
      var ORIGINAL_NUMBER_OF_LINES = 3;
      var TARGET_LINE = 1;

      var TEXT_OF_LINE_BEFORE_TARGET = 'First Line!';
      var TEXT_OF_TARGET_LINE        = '';
      var TEXT_OF_LINE_AFTER_TARGET  = 'Third Line!';

      var TYPE_OF_LINE_BEFORE_TARGET = 'shot';
      var TYPE_OF_TARGET_LINE        = 'action';
      var TYPE_OF_LINE_AFTER_TARGET  = 'parenthetical';

      var lineIsRemoved = function() {
        var $lines = helper.padInner$("div");
        return $lines.length === (ORIGINAL_NUMBER_OF_LINES - 1);
      }
      var lineIsBackToScript = function() {
        var $lines = helper.padInner$("div");
        return $lines.length === ORIGINAL_NUMBER_OF_LINES;
      }

      var testItRemovesTheEmptyLineAndKeepOriginalLineTypes = function() {
        it("removes the empty line and keeps original line types", function(done){
          helper.waitFor(function() {
            return lineIsRemoved();
          }).done(function() {
            utils.validateLineTextAndType(TARGET_LINE - 1, TEXT_OF_LINE_BEFORE_TARGET, TYPE_OF_LINE_BEFORE_TARGET);
            // line was already removed, so now line below is the new TARGET_LINE
            utils.validateLineTextAndType(TARGET_LINE, TEXT_OF_LINE_AFTER_TARGET, TYPE_OF_LINE_AFTER_TARGET);

            done();
          });
        });
      }

      var testItPlacesCaretAtTheEndOfLineAboveRemovedLine = function() {
        it("places the caret at the end of line above removed line", function(done){
          var $lineAboveRemovedLine = utils.getLine(TARGET_LINE-1);
          var endOfLineAboveRemovedLine = $lineAboveRemovedLine.text().length;

          expect(utils.getColumnWhereCaretIs()).to.be(endOfLineAboveRemovedLine);
          expect(utils.getLineWhereCaretIs().get(0)).to.be($lineAboveRemovedLine.get(0));

          done();
        });
      }
      var testItPlacesCaretAtTheBeginningOfLineBelowRemovedLine = function() {
        it("places the caret at the beginning of line below removed line", function(done){
          // line was already removed, so now line below is the new TARGET_LINE
          var $lineBelowRemovedLine = utils.getLine(TARGET_LINE);

          expect(utils.getColumnWhereCaretIs()).to.be(0);
          expect(utils.getLineWhereCaretIs().get(0)).to.be($lineBelowRemovedLine.get(0));

          done();
        });
      }

      var testUndoAddsEmptyLineBackAndKeepOriginalLineTypes = function() {
        context("then user presses UNDO", function(){
          before(function(done) {
            // wait some time, so changes are saved before undoing
            setTimeout(function() {
              utils.undo();
              done();
            }, 1000);
          });

          it("adds line back and keeps original line types", function(done){
            helper.waitFor(function() {
              return lineIsBackToScript();
            }).done(function() {
              utils.validateLineTextAndType(TARGET_LINE - 1, TEXT_OF_LINE_BEFORE_TARGET, TYPE_OF_LINE_BEFORE_TARGET);
              utils.validateLineTextAndType(TARGET_LINE    , TEXT_OF_TARGET_LINE       , TYPE_OF_TARGET_LINE);
              utils.validateLineTextAndType(TARGET_LINE + 1, TEXT_OF_LINE_AFTER_TARGET , TYPE_OF_LINE_AFTER_TARGET);

              done();
            });
          });
        });
      }

      before(function (done) {
        // remove content from target line
        var $targetLine = utils.getLine(TARGET_LINE).find("action");
        $targetLine.sendkeys('{selectall}');
        utils.pressKey(BACKSPACE);
        done();
      });
      after(function(done) {
        // make sure script is back to original state after finishing testing this context
        ep_script_elements_test_helper.mergeLines.createScriptWithThreeDifferentElements(done);
      });

      context("and user presses backspace in the beginning of empty line", function(){
        before(function(cb) {
          utils.placeCaretInTheBeginningOfLine(TARGET_LINE, function(){
            utils.pressKey(BACKSPACE);
            cb();
          });
        });

        testItRemovesTheEmptyLineAndKeepOriginalLineTypes();
        testItPlacesCaretAtTheEndOfLineAboveRemovedLine();
        testUndoAddsEmptyLineBackAndKeepOriginalLineTypes();
      });

      context("and user presses backspace in the beginning of line after empty line", function(){
        before(function(cb) {
          utils.placeCaretInTheBeginningOfLine(TARGET_LINE + 1, function(){
            utils.pressKey(BACKSPACE);
            cb();
          });
        });

        testItRemovesTheEmptyLineAndKeepOriginalLineTypes();
        testItPlacesCaretAtTheBeginningOfLineBelowRemovedLine();
        testUndoAddsEmptyLineBackAndKeepOriginalLineTypes();
      });

      context("and user presses delete at the end of the line before empty line", function(){
        before(function(cb) {
          utils.placeCaretAtTheEndOfLine(TARGET_LINE - 1, function(){
            utils.pressKey(DELETE);
            cb();
          });
        });

        testItRemovesTheEmptyLineAndKeepOriginalLineTypes();
        testItPlacesCaretAtTheEndOfLineAboveRemovedLine();
        testUndoAddsEmptyLineBackAndKeepOriginalLineTypes();
      });

      context("and user presses delete at the end of the empty line", function(){
        before(function(cb) {
          utils.placeCaretAtTheEndOfLine(TARGET_LINE, function(){
            // apparently first DELETE is ignored
            utils.pressKey(DELETE);
            utils.pressKey(DELETE);
            cb();
          });
        });

        testItRemovesTheEmptyLineAndKeepOriginalLineTypes();
        testItPlacesCaretAtTheBeginningOfLineBelowRemovedLine();
        testUndoAddsEmptyLineBackAndKeepOriginalLineTypes();
      });
    });
  });

  context('when user presses BACKSPACE and there is a selection', function(){
    var testItRestoresOriginalTextsAndTypesOnUndo = function() {
      context("and user performs undo", function(){
        beforeEach(function(done){
          // we have to wait a little to save the changes
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("restores the original text and types", function(done){
          helperFunctions.checkIfItHasTheOriginalText(done);
        });
      });
    }

    var selectLines = function(offsetAtFirstElement, offsetLastLineSelection) {
      // make the selection
      var inner$ = helper.padInner$;
      var $firstElement = inner$('div:has(shot)').first();
      var $lastElement = $firstElement.nextUntil('div:has(parenthetical)').next();

      var lastLineLength = $lastElement.text().length;
      var offsetAtlastElement = lastLineLength - offsetLastLineSelection;

      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);
    }
    var deleteSelection = function() {
      utils.pressKey(BACKSPACE);
    }

    context("and selection is wrapping more than one line", function(){

      context("and the first and last line of selection are partially selected and user removes selection", function(){

        before(function(done) {
          var offsetAtFirstElement = 3;
          var offsetLastLineSelection = 8;
          selectLines(offsetAtFirstElement, offsetLastLineSelection);
          deleteSelection();
          done();
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

        it("places the caret in the beginning of selection", function(done){
          helper.waitFor(function(){
            var $lineWhereCaretIs = utils.getLineWhereCaretIs();

            var caretIsOnShot = $lineWhereCaretIs.find("shot").length;
            return caretIsOnShot;
          }).done(done);
        });

        testItRestoresOriginalTextsAndTypesOnUndo();
      });

      context("and first line of selection is completely selected and last one is partially selected and user removes selection", function(){

        before(function(done) {
          var offsetAtFirstElement = 0;
          var offsetLastLineSelection = 8;
          selectLines(offsetAtFirstElement, offsetLastLineSelection);
          deleteSelection();
          done();
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

        testItRestoresOriginalTextsAndTypesOnUndo();
      });

      context("and first line of selection is partially selected and last one is completely selected and user removes selection", function(){
        before(function(done){
          var offsetAtFirstElement = 3;
          var offsetLastLineSelection = 0;
          selectLines(offsetAtFirstElement, offsetLastLineSelection);
          deleteSelection();
          done();
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

        testItRestoresOriginalTextsAndTypesOnUndo();
      });

      context("and first and last line is completely selected", function(){

        before(function(done){
          var offsetAtFirstElement = 0;
          var offsetLastLineSelection = 0;
          selectLines(offsetAtFirstElement, offsetLastLineSelection);
          deleteSelection();
          done();
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

        testItRestoresOriginalTextsAndTypesOnUndo();

      });
    });

    context("and line is selected until the line break", function(){
      var selectLines = function() {
        var inner$ = helper.padInner$;

        var $firstElement = inner$('div:has(shot)').first();
        var $lastElement = inner$('div:has(action)').first();

        var offsetAtFirstElement = 0;
        var offsetAtlastElement = 0;

        // make the selection
        helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);
      }

      before(function(done){
        selectLines();
        deleteSelection();
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

      testItRestoresOriginalTextsAndTypesOnUndo();
    });

    context("and selection has the same element on both edges", function(){
      var selectLines = function() {
        var inner$ = helper.padInner$;

        var $firstElement = inner$('div:has(shot)').first();
        var $lastElement = inner$('div:has(shot)').last();

        var offsetAtFirstElement = 2;
        var offsetAtlastElement = 8;

        // make the selection
        helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);
      }

      before(function(done){
        utils.cleanPad(function(){
          helperFunctions.createScriptWithFirstAndLastElementEqual(function(){
            selectLines();
            deleteSelection();
            done();
          });
        });
      });

      it("removes the lines between", function(done){
        helperFunctions.checkNumberOfLine(1);
        done();
      });

      it("join the lines", function(done){
        var textOfLine = "Fine!";
        var element = "shot";
        utils.validateLineTextAndType(0, textOfLine, element);
        done();
      });
    });
  });

  context('when first line of script is an empty element and there is a heading with scene marks after it', function() {
    var LINE_WITH_HEADING = 5;
    var ORIGINAL_NUMBER_OF_LINES = 7;

    var lineIsRemoved = function() {
      var $lines = helper.padInner$("div");
      return $lines.length === (ORIGINAL_NUMBER_OF_LINES - 1);
    }
    var lineIsBackToScript = function() {
      var $lines = helper.padInner$("div");
      return $lines.length === ORIGINAL_NUMBER_OF_LINES;
    }

    var testItRemovesFirstLineAndKeepOriginalLineTypes = function() {
      it("removes first line and keeps types of other lines", function(done) {
        var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

        helper.waitFor(function() {
          return lineIsRemoved();
        }).done(function() {
          utils.validateLineTextAndType(0, sceneMarkUtils.actNameOf('heading'), 'act_name');
          utils.validateLineTextAndType(1, sceneMarkUtils.actSummaryOf('heading'), 'act_summary');
          utils.validateLineTextAndType(2, sceneMarkUtils.sequenceNameOf('heading'), 'sequence_name');
          utils.validateLineTextAndType(3, sceneMarkUtils.sequenceSummaryOf('heading'), 'sequence_summary');
          utils.validateLineTextAndType(4, 'heading', 'heading');

          done();
        });
      });
    }

    var testUndoAddsEmptyLineBackAndKeepOriginalLineTypes = function() {
      context("then user presses UNDO", function(){
        before(function(done) {
          // wait some time, so changes are saved before undoing
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("adds line back and keeps original line types", function(done) {
          var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

          helper.waitFor(function() {
            return lineIsBackToScript();
          }).done(function() {
            utils.validateLineTextAndType(0, '', 'action');
            utils.validateLineTextAndType(1, sceneMarkUtils.actNameOf('heading'), 'act_name');
            utils.validateLineTextAndType(2, sceneMarkUtils.actSummaryOf('heading'), 'act_summary');
            utils.validateLineTextAndType(3, sceneMarkUtils.sequenceNameOf('heading'), 'sequence_name');
            utils.validateLineTextAndType(4, sceneMarkUtils.sequenceSummaryOf('heading'), 'sequence_summary');
            utils.validateLineTextAndType(5, 'heading', 'heading');

            done();
          });
        });
      });
    }

    before(function(done) {
      this.timeout(4000);
      helperFunctions.createScriptWithEmptyNonHeadingOnTopThenAHeadingWithSceneMark(done);
    });

    context('and user presses DELETE at the line on top of script', function() {
      before(function(done) {
        utils.placeCaretInTheBeginningOfLine(0, function() {
          utils.pressKey(DELETE);
          done();
        });
      });

      testItRemovesFirstLineAndKeepOriginalLineTypes();
      testUndoAddsEmptyLineBackAndKeepOriginalLineTypes();
    });

    context('and user presses BACKSPACE at the beginning of line with heading', function() {
      before(function(done) {
        utils.placeCaretInTheBeginningOfLine(LINE_WITH_HEADING, function() {
          utils.pressKey(BACKSPACE);
          done();
        });
      });

      testItRemovesFirstLineAndKeepOriginalLineTypes();
      testUndoAddsEmptyLineBackAndKeepOriginalLineTypes();
    });
  });

});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.mergeLines = {
  createScriptWithFirstAndLastElementEqual: function(cb) {
    var utils = ep_script_elements_test_helper.utils;

    var shot          = utils.shot("First Line!");
    var action        = utils.action("Second Line!");
    var secondShot    = utils.shot("Third Line!");
    var script        = shot + action + secondShot;

    utils.createScriptWith(script, "Third Line!", cb);
  },
  createScriptWithThreeDifferentElements: function(cb) {
    var utils = ep_script_elements_test_helper.utils;

    var shot          = utils.shot("First Line!");
    var action        = utils.action("Second Line!");
    var parenthetical = utils.parenthetical("Third Line!");
    var script        = shot + action + parenthetical;

    utils.cleanPad(function() {
      utils.createScriptWith(script, "Third Line!", cb);
    });
  },
  createScriptWithEmptyNonHeadingOnTopThenAHeadingWithSceneMark: function(cb){
    var utils = ep_script_elements_test_helper.utils;
    var sceneMarkUtils = ep_script_scene_marks_test_helper.utils;

    var empty     = utils.general('');
    var act       = sceneMarkUtils.act('heading');
    var sequence  = sceneMarkUtils.sequence('heading');
    var heading   = utils.heading('heading');
    var character = utils.character('character');
    var script    = empty + act + sequence + heading + character;

    utils.cleanPad(function() {
      utils.createScriptWith(script, 'character', function() {
        // change type of first line just to avoid confusion with general
        utils.changeToElement(utils.ACTION, function() {
          sceneMarkUtils.clickOnSceneMarkButtonOfLine(4);
          cb();
        });
      });
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
