describe('ep_script_elements - drag and drop', function() {
  var utils;

  // separator =====
  var TARGET_GENERAL                  = 1;
  var TARGET_ACT_NAME                 = TARGET_GENERAL + 1;
  var TARGET_ACT_SUMMARY              = TARGET_ACT_NAME + 1;
  var TARGET_SEQ_NAME                 = TARGET_ACT_SUMMARY + 1;
  var TARGET_SEQ_SUMMARY              = TARGET_SEQ_NAME + 1;
  var TARGET_HEADING_WITH_SM          = TARGET_SEQ_SUMMARY + 1;
  var TARGET_LINE_WITH_DIFFERENT_TYPE = TARGET_HEADING_WITH_SM + 1;
  var TARGET_LINE_WITH_SAME_TYPE      = TARGET_LINE_WITH_DIFFERENT_TYPE + 1;
  // separator =====
  var SOURCE_LINE_1 = TARGET_LINE_WITH_SAME_TYPE + 2;
  var SOURCE_LINE_2 = SOURCE_LINE_1 + 1;
  var SOURCE_LINE_3 = SOURCE_LINE_2 + 1;
  // separator =====
  var GENERAL_SOURCE_LINE_1 = SOURCE_LINE_3 + 2;
  var GENERAL_SOURCE_LINE_2 = GENERAL_SOURCE_LINE_1 + 1;
  var GENERAL_SOURCE_LINE_3 = GENERAL_SOURCE_LINE_2 + 1;

  var SOURCE_TYPE = 'action';
  var DIFFERENT_TYPE = 'dialogue';

  var SOURCE_TEXT = {
    action: 'The source 1\nThe source 2\nThe source 3',
    general: 'The source with general 1\nThe source with general 2\nThe source with general 3'
  };

  var createScript = function(done) {
    var smUtils = ep_script_scene_marks_test_helper.utils;

    var targetGeneral         = utils.general('Target with general []');
    var targetActName         = utils.actName('Target with act name []');
    var targetActSummary      = utils.actSummary('Target with act summary []');
    var targetSequenceName    = utils.sequenceName('Target with sequence name []');
    var targetSequenceSummary = utils.sequenceSummary('Target with sequence summary []');
    var targetHeading         = utils.heading('Target with heading with scene mark []');
    var targetScene           = targetActName + targetActSummary + targetSequenceName + targetSequenceSummary + targetHeading;
    var targetDialogue        = utils.dialogue('Target with different type []');
    var targetAction          = utils.action('Target with same type []');

    var sourceAction1 = utils.action('The source 1');
    var sourceAction2 = utils.action('The source 2');
    var sourceAction3 = utils.action('The source 3');

    var sourceGeneral1 = utils.general('The source with general 1');
    var sourceGeneral2 = utils.general('The source with general 2');
    var sourceGeneral3 = utils.general('The source with general 3');

    var separator = utils.general('=======');
    var lastLine = utils.general('last line');

    var script = separator +
                 targetGeneral + targetScene + targetDialogue + targetAction +
                 separator +
                 sourceAction1 + sourceAction2 + sourceAction3 +
                 separator +
                 sourceGeneral1 + sourceGeneral2 + sourceGeneral3 +
                 separator +
                 lastLine;

    utils.createScriptWith(script, 'last line', done);
  }

  var undoAndWaitForScriptToBeBackToOriginal = function(done) {
    utils.undo();

    helper.waitFor(function() {
      var textWasRestored =
        utils.getLine(TARGET_GENERAL).text()                  === 'Target with general []' &&
        utils.getLine(TARGET_ACT_NAME).text()                 === 'Target with act name []' &&
        utils.getLine(TARGET_ACT_SUMMARY).text()              === 'Target with act summary []' &&
        utils.getLine(TARGET_SEQ_NAME).text()                 === 'Target with sequence name []' &&
        utils.getLine(TARGET_SEQ_SUMMARY).text()              === 'Target with sequence summary []' &&
        utils.getLine(TARGET_HEADING_WITH_SM).text()          === 'Target with heading with scene mark []' &&
        utils.getLine(TARGET_LINE_WITH_DIFFERENT_TYPE).text() === 'Target with different type []' &&
        utils.getLine(TARGET_LINE_WITH_SAME_TYPE).text()      === 'Target with same type []' &&
        utils.getLine(SOURCE_LINE_1).text()                   === 'The source 1' &&
        utils.getLine(SOURCE_LINE_2).text()                   === 'The source 2' &&
        utils.getLine(SOURCE_LINE_3).text()                   === 'The source 3' &&
        utils.getLine(GENERAL_SOURCE_LINE_1).text()           === 'The source with general 1' &&
        utils.getLine(GENERAL_SOURCE_LINE_2).text()           === 'The source with general 2' &&
        utils.getLine(GENERAL_SOURCE_LINE_3).text()           === 'The source with general 3';
      var typesWereRestored =
        utils.getLineType(TARGET_GENERAL)                  === utils.GENERAL &&
        utils.getLineType(TARGET_ACT_NAME)                 === 'act_name' &&
        utils.getLineType(TARGET_ACT_SUMMARY)              === 'act_summary' &&
        utils.getLineType(TARGET_SEQ_NAME)                 === 'sequence_name' &&
        utils.getLineType(TARGET_SEQ_SUMMARY)              === 'sequence_summary' &&
        utils.getLineType(TARGET_HEADING_WITH_SM)          === utils.HEADING &&
        utils.getLineType(TARGET_LINE_WITH_DIFFERENT_TYPE) === DIFFERENT_TYPE &&
        utils.getLineType(TARGET_LINE_WITH_SAME_TYPE)      === SOURCE_TYPE &&
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
    var selectPartOfOneSourceLine = function(sourceLine) {
      // select text "source" from line
      var $source = utils.getLine(sourceLine);
      var start = 'The '.length;
      var end = start + 'source'.length;
      helper.selectLines($source, $source, start, end);
    };

    var dragAndDrop = function(targetPosition, targetLine, done) {
      var dragAndDropMethod;
      if (targetPosition === 'middle') {
        dragAndDropMethod = utils.dragSelectedTextAndDropItIntoMiddleOfLine;
      } else if (targetPosition === 'end') {
        dragAndDropMethod = utils.dragSelectedTextAndDropItIntoEndOfLine;
      } else {
        dragAndDropMethod = utils.dragSelectedTextAndDropItIntoBeginningOfLine;
      }
      dragAndDropMethod(targetLine, done);
    }

    var testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine = function(targetLine, targetLineType, expectedTargetLineText, dropPosition) {
      before(function(done) {
        selectPartOfOneSourceLine(SOURCE_LINE_1);
        dragAndDrop(dropPosition, targetLine, done);
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

    context('and drops it into the middle of a line with script element', function() {
      var DROP_POSITION = 'middle';

      context('and target line is not a general', function() {
        var targetLineTextAfterDrop = 'Target with different type [source]';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_LINE_WITH_DIFFERENT_TYPE, DIFFERENT_TYPE, targetLineTextAfterDrop, DROP_POSITION);
      });

      context('and target line is a general', function() {
        var targetLineTextAfterDrop = 'Target with general [source]';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_GENERAL, 'general', targetLineTextAfterDrop, DROP_POSITION);
      });
    });

    context('and drops it into the beginning of a line with script element', function() {
      var DROP_POSITION = 'beginning';

      context('and target line is not a general', function() {
        var targetLineTextAfterDrop = 'sourceTarget with different type []';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_LINE_WITH_DIFFERENT_TYPE, DIFFERENT_TYPE, targetLineTextAfterDrop, DROP_POSITION);
      });

      context('and target line is a general', function() {
        var targetLineTextAfterDrop = 'sourceTarget with general []';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_GENERAL, 'general', targetLineTextAfterDrop, DROP_POSITION);
      });
    });

    context('and drops it into the end of a line with script element', function() {
      var DROP_POSITION = 'end';

      context('and target line is not a general', function() {
        var targetLineTextAfterDrop = 'Target with different type []source';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_LINE_WITH_DIFFERENT_TYPE, DIFFERENT_TYPE, targetLineTextAfterDrop, DROP_POSITION);
      });

      context('and target line is a general', function() {
        var targetLineTextAfterDrop = 'Target with general []source';
        testItDoesNotChangeTargetLineTypeAndItRemovesTextFromOriginalLine(TARGET_GENERAL, 'general', targetLineTextAfterDrop, DROP_POSITION);
      });
    });
  });

  context('when user drags multiple full lines with script elements', function() {
    var selectAllSourceLines = function(firstSourceLineNumber, lastSourceLineNumber) {
      var $firstSourceLine = utils.getLine(firstSourceLineNumber);
      var $lastSourceLine = utils.getLine(lastSourceLineNumber);
      helper.selectLines($firstSourceLine, $lastSourceLine);
    }

    var testMovedNonGeneralsAreStillSelected = function() {
      testDroppedContentIsStillSelected(SOURCE_TYPE);
    }
    var testMovedGeneralsAreStillSelected = function() {
      testDroppedContentIsStillSelected('general');
    }
    var testDroppedContentIsStillSelected = function(typeOfSourceLines) {
      it('keeps dropped text still selected', function(done) {
        var expectedText = SOURCE_TEXT[typeOfSourceLines];

        // text might take a while to be fully processed
        helper.waitFor(function() {
          return utils.getSelectedText() === expectedText;
        }).done(done);
      });
    }

    context('and drops them into the middle of a line with script element', function() {
      context('and target line has the same type of the dragged lines', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoMiddleOfLine(TARGET_LINE_WITH_SAME_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

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

        context('and source lines are generals', function() {
          before(function(done) {
            selectAllSourceLines(GENERAL_SOURCE_LINE_1, GENERAL_SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoMiddleOfLine(TARGET_LINE_WITH_DIFFERENT_TYPE, done);
          });
          after(function(done) {
            undoAndWaitForScriptToBeBackToOriginal(done);
          });

          testMovedGeneralsAreStillSelected();

          it('splits first half of target line', function(done) {
            utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE, 'Target with different type [', DIFFERENT_TYPE);
            done();
          });

          it('splits second half of target line', function(done) {
            utils.validateLineTextAndType(SECOND_HALF_OF_TARGET_LINE, ']', DIFFERENT_TYPE);
            done();
          });

          it('places all dragged content between split halves of original target line', function(done) {
            utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 1, 'The source with general 1', utils.GENERAL);
            utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 2, 'The source with general 2', utils.GENERAL);
            utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 3, 'The source with general 3', utils.GENERAL);
            done();
          });
        });

        context('and source lines are not generals', function() {
          before(function(done) {
            selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoMiddleOfLine(TARGET_LINE_WITH_DIFFERENT_TYPE, done);
          });
          after(function(done) {
            undoAndWaitForScriptToBeBackToOriginal(done);
          });

          testMovedNonGeneralsAreStillSelected();

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
      });

      context('and target line is a general', function() {
        // original target line will be split in 2, and dragged lines will be between halves
        var SECOND_HALF_OF_TARGET_LINE = TARGET_GENERAL + 4;

        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoMiddleOfLine(TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

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
          selectAllSourceLines(GENERAL_SOURCE_LINE_1, GENERAL_SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoMiddleOfLine(TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedGeneralsAreStillSelected();

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
      context('and target line has the same type of the dragged lines', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoBeginningOfLine(TARGET_LINE_WITH_SAME_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('merges last line of dragged content with target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 2, 'The source 3Target with same type []', SOURCE_TYPE);
          done();
        });

        it('places other lines of dragged content before merged lines', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 1, 'The source 2', SOURCE_TYPE);
          done();
        });
      });

      context('and target line has a different type of the dragged lines', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoBeginningOfLine(TARGET_LINE_WITH_DIFFERENT_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('does not merge any text with target line, nor splits it anywhere', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 3, 'Target with different type []', DIFFERENT_TYPE);
          done();
        });

        it('places all dragged content above original target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 2, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and target line is a general', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoBeginningOfLine(TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('does not merge any text with target line, nor splits it anywhere', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 3, 'Target with general []', utils.GENERAL);
          done();
        });

        it('places all dragged content above original target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and source and target lines are all generals', function() {
        before(function(done) {
          selectAllSourceLines(GENERAL_SOURCE_LINE_1, GENERAL_SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoBeginningOfLine(TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedGeneralsAreStillSelected();

        it('merges last line of dragged content with target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source with general 3Target with general []', utils.GENERAL);
          done();
        });

        it('places other lines of dragged content before merged lines', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL    , 'The source with general 1', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source with general 2', utils.GENERAL);
          done();
        });
      });

      context('and target line is a heading with scene marks', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoBeginningOfLine(TARGET_HEADING_WITH_SM, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('does not merge any text with target line, nor splits it anywhere', function(done) {
          utils.validateLineTextAndType(TARGET_HEADING_WITH_SM + 3, 'Target with heading with scene mark []', utils.HEADING);
          done();
        });

        it('places all dragged content above scene marks of target line', function(done) {
          utils.validateLineTextAndType(TARGET_ACT_NAME    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_ACT_NAME + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_ACT_NAME + 2, 'The source 3', SOURCE_TYPE);
          done();
        });
      });
    });

    context('and drops them into the end of a line with script element', function() {
      context('and target line has the same type of the dragged lines', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_LINE_WITH_SAME_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('merges first line of dragged content with target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE, 'Target with same type []The source 1', SOURCE_TYPE);
          done();
        });

        it('places other lines of dragged content after merged lines', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 2, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and target line has a different type of the dragged lines', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_LINE_WITH_DIFFERENT_TYPE, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('does not merge any text with target line, nor splits it anywhere', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE, 'Target with different type []', DIFFERENT_TYPE);
          done();
        });

        it('places all dragged content below original target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 1, 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 2, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 3, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and target line is a general', function() {
        before(function(done) {
          selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('does not merge any text with target line, nor splits it anywhere', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL, 'Target with general []', utils.GENERAL);
          done();
        });

        it('places all dragged content below original target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 3, 'The source 3', SOURCE_TYPE);
          done();
        });
      });

      context('and source and target lines are all generals', function() {
        before(function(done) {
          selectAllSourceLines(GENERAL_SOURCE_LINE_1, GENERAL_SOURCE_LINE_3);
          utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_GENERAL, done);
        });
        after(function(done) {
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedGeneralsAreStillSelected();

        it('merges first line of dragged content with target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL, 'Target with general []The source with general 1', utils.GENERAL);
          done();
        });

        it('places other lines of dragged content after merged lines', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source with general 2', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source with general 3', utils.GENERAL);
          done();
        });
      });
    });

    context('and drops them into an empty line with script element', function() {
      var removeContentFromLine = function(lineNumber, done) {
        var $line = utils.getLine(lineNumber);
        $line.sendkeys('{selectall}');
        utils.pressBackspace();

        // wait for line to be processed -- it should have a br when Etherpad finishes processing it
        helper.waitFor(function() {
          var $line = utils.getLine(lineNumber);
          var lineIsEmpty = $line.find('br').length !== 0;
          return lineIsEmpty;
        }).done(done);
      }

      context('and target line has the same type of the dragged lines', function() {
        before(function(done) {
          removeContentFromLine(TARGET_LINE_WITH_SAME_TYPE, function() {
            selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_LINE_WITH_SAME_TYPE, done);
          });
        });
        after(function(done) {
          // need an extra undo to restore empty line content
          utils.undo();
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('places dragged content where target line originally was', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 2, 'The source 3', SOURCE_TYPE);
          done();
        });

        it('does not change any of the lines besides dragged content', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE - 1, 'Target with different type []', DIFFERENT_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_SAME_TYPE + 3, '=======', utils.GENERAL);
          done();
        });
      });

      context('and target line has a different type of the dragged lines', function() {
        before(function(done) {
          removeContentFromLine(TARGET_LINE_WITH_DIFFERENT_TYPE, function() {
            selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_LINE_WITH_DIFFERENT_TYPE, done);
          });
        });
        after(function(done) {
          // need an extra undo to restore empty line content
          utils.undo();
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('places all dragged content above original target line', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 2, 'The source 3', SOURCE_TYPE);
          done();
        });

        it('does not change any of the lines besides dragged content', function(done) {
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE - 1, 'Target with heading with scene mark []', utils.HEADING);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 3, '', DIFFERENT_TYPE);
          utils.validateLineTextAndType(TARGET_LINE_WITH_DIFFERENT_TYPE + 4, 'Target with same type []', SOURCE_TYPE);
          done();
        });
      });

      context('and target line is a general', function() {
        before(function(done) {
          removeContentFromLine(TARGET_GENERAL, function() {
            selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_GENERAL, done);
          });
        });
        after(function(done) {
          // need an extra undo to restore empty line content
          utils.undo();
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('places all dragged content above original target line', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source 3', SOURCE_TYPE);
          done();
        });

        it('does not change any of the lines besides dragged content', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL - 1, '=======', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 3, '', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 4, 'Target with act name []', 'act_name');
          done();
        });
      });

      context('and source and target lines are all generals', function() {
        before(function(done) {
          removeContentFromLine(TARGET_GENERAL, function() {
            selectAllSourceLines(GENERAL_SOURCE_LINE_1, GENERAL_SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_GENERAL, done);
          });
        });
        after(function(done) {
          // need an extra undo to restore empty line content
          utils.undo();
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedGeneralsAreStillSelected();

        it('places dragged content where target line originally was', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL    , 'The source with general 1', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 1, 'The source with general 2', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 2, 'The source with general 3', utils.GENERAL);
          done();
        });

        it('does not change any of the lines besides dragged content', function(done) {
          utils.validateLineTextAndType(TARGET_GENERAL - 1, '=======', utils.GENERAL);
          utils.validateLineTextAndType(TARGET_GENERAL + 3, 'Target with act name []', 'act_name');
          done();
        });
      });

      context('and target line is a heading with scene marks', function() {
        before(function(done) {
          removeContentFromLine(TARGET_HEADING_WITH_SM, function() {
            selectAllSourceLines(SOURCE_LINE_1, SOURCE_LINE_3);
            utils.dragSelectedTextAndDropItIntoEndOfLine(TARGET_HEADING_WITH_SM, done);
          });
        });
        after(function(done) {
          // need an extra undo to restore empty line content
          utils.undo();
          undoAndWaitForScriptToBeBackToOriginal(done);
        });

        testMovedNonGeneralsAreStillSelected();

        it('places all dragged content above scene marks of target line', function(done) {
          utils.validateLineTextAndType(TARGET_ACT_NAME    , 'The source 1', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_ACT_NAME + 1, 'The source 2', SOURCE_TYPE);
          utils.validateLineTextAndType(TARGET_ACT_NAME + 2, 'The source 3', SOURCE_TYPE);
          done();
        });

        it('does not change any of the lines besides dragged content', function(done) {
          utils.validateLineTextAndType(TARGET_ACT_NAME - 1, 'Target with general []', utils.GENERAL);
          // check the entire block of heading + SMs
          utils.validateLineTextAndType(TARGET_ACT_NAME + 3, 'Target with act name []', 'act_name');
          utils.validateLineTextAndType(TARGET_ACT_NAME + 4, 'Target with act summary []', 'act_summary');
          utils.validateLineTextAndType(TARGET_ACT_NAME + 5, 'Target with sequence name []', 'sequence_name');
          utils.validateLineTextAndType(TARGET_ACT_NAME + 6, 'Target with sequence summary []', 'sequence_summary');
          utils.validateLineTextAndType(TARGET_HEADING_WITH_SM + 3, '', utils.HEADING);
          done();
        });
      });
    });
  });
});