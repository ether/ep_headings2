describe('ep_script_elements - drag and drop', function() {
  var utils;

  var TARGET_GENERAL = 0;
  var TARGET_LINE_WITH_SAME_TYPE = 1;
  var TARGET_LINE_WITH_DIFFERENT_TYPE = 2;
  // separator =====
  var SOURCE_LINE_1 = 4;
  var SOURCE_LINE_2 = 5;
  var SOURCE_LINE_3 = 6;
  // separator =====
  var GENERAL_SOURCE_LINE_1 = 8;
  var GENERAL_SOURCE_LINE_2 = 9;
  var GENERAL_SOURCE_LINE_3 = 10;

  var SOURCE_TYPE = 'action';
  var DIFFERENT_TYPE = 'dialogue';

  var createScript = function(done) {
    var target_general  = utils.general('Target with general []');
    var target_action   = utils.action('Target with same type []');
    var target_dialogue = utils.dialogue('Target with different type []');

    var source_action1 = utils.action('The source 1');
    var source_action2 = utils.action('The source 2');
    var source_action3 = utils.action('The source 3');

    var source_general1 = utils.general('The source with general 1');
    var source_general2 = utils.general('The source with general 2');
    var source_general3 = utils.general('The source with general 3');

    var separator = utils.general('=======');
    var lastLine = utils.general('last line');

    var script = target_general + target_action + target_dialogue +
                 separator +
                 source_action1 + source_action2 + source_action3 +
                 separator +
                 source_general1 + source_general2 + source_general3 +
                 separator + lastLine;

    utils.createScriptWith(script, 'last line', done);
  }

  var undoAndWaitForScriptToBeBackToOriginal = function(done) {
    utils.undo();

    helper.waitFor(function() {
      var textWasRestored =
        utils.getLine(TARGET_GENERAL).text()                  === 'Target with general []' &&
        utils.getLine(TARGET_LINE_WITH_SAME_TYPE).text()      === 'Target with same type []' &&
        utils.getLine(TARGET_LINE_WITH_DIFFERENT_TYPE).text() === 'Target with different type []' &&
        utils.getLine(SOURCE_LINE_1).text()                   === 'The source 1' &&
        utils.getLine(SOURCE_LINE_2).text()                   === 'The source 2' &&
        utils.getLine(SOURCE_LINE_3).text()                   === 'The source 3' &&
        utils.getLine(GENERAL_SOURCE_LINE_1).text()           === 'The source with general 1' &&
        utils.getLine(GENERAL_SOURCE_LINE_2).text()           === 'The source with general 2' &&
        utils.getLine(GENERAL_SOURCE_LINE_3).text()           === 'The source with general 3';
      var typesWereRestored =
        utils.getLineType(TARGET_LINE_WITH_SAME_TYPE)      === SOURCE_TYPE &&
        utils.getLineType(TARGET_LINE_WITH_DIFFERENT_TYPE) === DIFFERENT_TYPE &&
        utils.getLineType(SOURCE_LINE_1)                   === SOURCE_TYPE &&
        utils.getLineType(SOURCE_LINE_2)                   === SOURCE_TYPE &&
        utils.getLineType(SOURCE_LINE_3)                   === SOURCE_TYPE &&
        utils.getLineType(GENERAL_SOURCE_LINE_1)           === utils.GENERAL &&
        utils.getLineType(GENERAL_SOURCE_LINE_2)           === utils.GENERAL &&
        utils.getLineType(GENERAL_SOURCE_LINE_3)           === utils.GENERAL;

      return textWasRestored && typesWereRestored;
    }).done(done);
  }

  before(function(done) {
    utils = ep_script_elements_test_helper.utils;

    helper.newPad(function(){
      utils.cleanPad(function() {
        createScript(done);
      });
    });

    this.timeout(60000);
  });

  context('when user drags part of a line', function() {
    var selectPartOfOneSourceLineAndDropItIntoMiddleOfLine = function(targetLine, done) {
      // select part of first line
      var $source = utils.getLine(SOURCE_LINE_1);
      var start = 'The '.length;
      var end = start + 'source'.length;
      helper.selectLines($source, $source, start, end);

      // drag into another line
      utils.dragSelectedTextAndDropItIntoMiddleOfLine(targetLine, done);
    };

    context('and drops it into the middle of a line with script element', function() {
      var testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine = function(targetLine, targetLineType, expectedTargetLineText) {
        before(function(done) {
          selectPartOfOneSourceLineAndDropItIntoMiddleOfLine(targetLine, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        it('inserts dragged text into target line and does not change its type', function(done) {
          utils.validateLineTextAndType(targetLine, expectedTargetLineText, targetLineType);
          done();
        });

        it('removes text from source line and does not change its type', function(done) {
          utils.validateLineTextAndType(SOURCE_LINE_1, 'The  1', SOURCE_TYPE);
          done();
        });
      }

      context('and target line is not a general', function() {
        var targetLineTextAfterDrop = 'Target with different type [source]';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_LINE_WITH_DIFFERENT_TYPE, DIFFERENT_TYPE, targetLineTextAfterDrop);
      });

      context('and target line is a general', function() {
        var targetLineTextAfterDrop = 'Target with general [source]';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_GENERAL, 'general', targetLineTextAfterDrop);
      });
    });

    context('and drops it into the beginning of a line with script element', function() {
      it('should be implemented');
    });
    context('and drops it into the end of a line with script element', function() {
      it('should be implemented');
    });
  });

  context('when user drags multiple full lines with script elements', function() {
    var selectAllSourceLinesAndDropItIntoMiddleOfLine = function(firstSourceLineNumber, lastSourceLineNumber, targetLine, done) {
      var $firstSourceLine = utils.getLine(firstSourceLineNumber);
      var $lastSourceLine = utils.getLine(lastSourceLineNumber);
      helper.selectLines($firstSourceLine, $lastSourceLine);

      utils.dragSelectedTextAndDropItIntoMiddleOfLine(targetLine, done);
    }

    context('and drops them into the middle of a line with script element', function() {
      context('and target line has the same type of the dragged lines', function() {
        before(function(done) {
          selectAllSourceLinesAndDropItIntoMiddleOfLine(SOURCE_LINE_1, SOURCE_LINE_3, TARGET_LINE_WITH_SAME_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        it('merges first line of dragged content with first half of target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE, 'Target with same type [The source 1', SOURCE_TYPE);
          done();
        });

        it('merges last line of dragged content with second half of target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 2, 'The source 3]', SOURCE_TYPE);
          done();
        });

        it('places lines in the middle of dragged content between merged lines', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 1, 'The source 2', SOURCE_TYPE);
          done();
        });
      });

      context('and target line has a different type of the dragged lines', function() {
        // original target line will be split in 2, and dragged lines will be between halves
        var SECOND_HALF_OF_TARGET_LINE = TARGET_LINE_WITH_DIFFERENT_TYPE + 4;

        before(function(done) {
          selectAllSourceLinesAndDropItIntoMiddleOfLine(SOURCE_LINE_1, SOURCE_LINE_3, TARGET_LINE_WITH_DIFFERENT_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        it('splits first half of target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE, 'Target with different type [', DIFFERENT_TYPE);
          done();
        });

        it('splits second half of target line', function(done) {
          utils.validateLineTextAndType(SECOND_HALF_OF_TARGET_LINE, ']', DIFFERENT_TYPE);
          done();
        });

        it('places all dragged content between split halves of original target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 1, 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 2, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 3, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and target line is a general', function() {
        // original target line will be split in 2, and dragged lines will be between halves
        var SECOND_HALF_OF_TARGET_LINE = TARGET_GENERAL + 4;

        before(function(done) {
          selectAllSourceLinesAndDropItIntoMiddleOfLine(SOURCE_LINE_1, SOURCE_LINE_3, TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        it('splits first half of target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL, 'Target with general [', utils.GENERAL);
          done();
        });

        it('splits second half of target line', function(done) {
          utils.validateLineTextAndType(SECOND_HALF_OF_TARGET_LINE, ']', utils.GENERAL);
          done();
        });

        it('places all dragged content between split halves of original target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 3, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and source and target lines are all generals', function() {
        before(function(done) {
          selectAllSourceLinesAndDropItIntoMiddleOfLine(GENERAL_SOURCE_LINE_1, GENERAL_SOURCE_LINE_3, TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        it('merges first line of dragged content with first half of target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL, 'Target with general [The source with general 1', utils.GENERAL);
          done();
        });

        it('merges last line of dragged content with second half of target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source with general 3]', utils.GENERAL);
          done();
        });

        it('places lines in the middle of dragged content between merged lines', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source with general 2', utils.GENERAL);
          done();
        });
      });
    });

    context('and drops them into the beginning of a line with script element', function() {
      it('should be implemented');
    });
    context('and drops them into the end of a line with script element', function() {
      it('should be implemented');
    });

  });
});