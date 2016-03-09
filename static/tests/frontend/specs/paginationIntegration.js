describe("ep_script_elements - integration with ep_script_page_view", function() {
  var utils, padId;
  before(function() {
    utils = ep_script_elements_test_helper.utils;
  });

  //create a new pad before each test run
  beforeEach(function(cb) {
    padId = helper.newPad(cb);
    this.timeout(60000);
  });

  context("when pad has a non-split page break", function() {
    var buildScript;
    var lastLineText = "last line";

    beforeEach(function(done) {
      this.timeout(60000);

      var inner$ = helper.padInner$;

      utils.createScriptWith(buildScript(), lastLineText, function() {
        // wait for pagination to finish creating page breaks
        helper.waitFor(function() {
          var $linesWithPageBreaks = inner$("div nonSplitPageBreak");
          return $linesWithPageBreaks.length === 1;
        }, 2000).done(function() {
          // reload the pad so tests for UNDO work properly.
          // But first need to wait for changes of pagination to be saved
          setTimeout(function() {
            helper.newPad(done, padId);
          }, 1000);
        });
      });
    });

    context("with a block", function() {
      var LINE_OF_TRANSITION = GENERALS_PER_PAGE - 2;

      before(function() {
        buildScript = function() {
          var lastLineText = "last line";

          // create a script with generals => character => parenthetical => transition => general
          var generals      = utils.buildScriptWithGenerals("general", GENERALS_PER_PAGE - 4);
          var character     = utils.character("character");
          var parenthetical = utils.parenthetical("parenthetical");
          var transition    = utils.transition("transition");
          var lastGeneral   = utils.general(lastLineText);

          var script = generals + character + parenthetical + transition + lastGeneral;

          return script;
        };
      });

      // FIXME: this context still breaks. No solution was found to fix this issue yet
      context("and user changes line of block from transition to general", function() {
        beforeEach(function(done) {
          var inner$ = helper.padInner$;

          // place caret on line with transition
          var $transition = utils.getLine(LINE_OF_TRANSITION);
          $transition.sendkeys('{selectall}');

          // set line to general
          utils.changeToElement(utils.GENERAL, function() {
            // wait for pagination to move last general to top of page
            helper.waitFor(function() {
              var $lineAfterPageBreak = inner$("div:has(nonSplitPageBreak)").next();
              return utils.cleanText($lineAfterPageBreak.text()) === lastLineText;
            }).done(done);
          }, LINE_OF_TRANSITION);
        });

        context("then presses UNDO", function() {
          beforeEach(function(done) {
            // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
            setTimeout(function() {
              utils.undo();
              done();
            }, 1000);
          });

          xit("changes line back to transition", function(done) {
            var inner$ = helper.padInner$;

            // wait until line is changed to transition
            helper.waitFor(function() {
              var $transition = utils.getLine(LINE_OF_TRANSITION);
              var lineIsTransitionAgain = $transition.find("transition").length === 1;

              return lineIsTransitionAgain;
            }).done(function() {
              // just to make sure UNDO was successful, test if pagination moved block
              // back to 2nd page
              helper.waitFor(function() {
                var $lineAfterPageBreak = inner$("div:has(nonSplitPageBreak)").next();
                return $lineAfterPageBreak.text() === "character";
              }).done(done);
            });
          });

          context("then presses REDO again", function() {
            beforeEach(function(done) {
              // wait until UNDO is complete (and line is a transition again)
              helper.waitFor(function() {
                var $transition = utils.getLine(LINE_OF_TRANSITION);
                var lineIsTransitionAgain = $transition.find("transition").length === 1;

                return lineIsTransitionAgain;
              }).done(function() {
                utils.redo();
                done();
              });
            });

            xit("changes line back to general", function(done) {
              var inner$ = helper.padInner$;

              // wait until line is changed to general
              helper.waitFor(function() {
                var $transition = utils.getLine(LINE_OF_TRANSITION);
                var lineIsGeneralAgain = $transition.find("transition").length === 0;

                return lineIsGeneralAgain;
              }).done(function() {
                // just to make sure REDO was successful, test if pagination moved block
                // back to 1st page
                helper.waitFor(function() {
                  var $lineAfterPageBreak = inner$("div:has(nonSplitPageBreak)").next();
                  return $lineAfterPageBreak.text() === lastLineText;
                }).done(done);
              });
            });
          });
        });
      });
    });

    context("with no block", function() {
      var LINE_OF_ACTION = GENERALS_PER_PAGE - 2;

      before(function() {
        buildScript = function() {
          // create a script with generals => action => general => general
          var generals           = utils.buildScriptWithGenerals("general", LINE_OF_ACTION);
          var action             = utils.action("action");
          var generalAfterAction = utils.general("general after action");
          var lastGeneral        = utils.general(lastLineText);

          var script = generals + action + generalAfterAction + lastGeneral;

          return script;
        };
      });

      context("and user changes last line of page from action to general", function() {
        beforeEach(function(done) {
          var inner$ = helper.padInner$;

          // place caret on line with action
          var $action = utils.getLine(LINE_OF_ACTION);
          $action.sendkeys('{selectall}');

          // set line to general
          utils.changeToElement(utils.GENERAL, function() {
            // wait for pagination to move last general to top of page
            helper.waitFor(function() {
              var $lineAfterPageBreak = inner$("div:has(nonSplitPageBreak)").next();
              return utils.cleanText($lineAfterPageBreak.text()) === lastLineText;
            }).done(done);
          }, LINE_OF_ACTION);
        });

        // this test is to avoid displaying line with "*" in the beginning of line
        it("displays line without '*'", function(done) {
          var $action = utils.getLine(LINE_OF_ACTION);

          expect($action.text()).to.be("action");

          done();
        });

        context("then presses UNDO", function() {
          beforeEach(function(done) {
            // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
            setTimeout(function() {
              utils.undo();
              done();
            }, 1000);
          });

          it("changes line back to action", function(done) {
            var inner$ = helper.padInner$;

            // wait until line is changed to action
            helper.waitFor(function() {
              var $action = utils.getLine(LINE_OF_ACTION);
              var lineIsActionAgain = $action.find("action").length === 1;

              return lineIsActionAgain;
            }).done(function() {
              // just to make sure UNDO was successful, test if pagination moved both generals
              // back to 2nd page
              helper.waitFor(function() {
                var $lineAfterPageBreak = inner$("div:has(nonSplitPageBreak)").next();
                return $lineAfterPageBreak.text() === "general after action";
              }).done(done);
            });
          });

          context("then presses REDO again", function() {
            beforeEach(function(done) {
              // wait until REDO is complete (and line is an action again)
              helper.waitFor(function() {
                var $action = utils.getLine(LINE_OF_ACTION);
                var lineIsActionAgain = $action.find("action").length === 1;

                return lineIsActionAgain;
              }).done(function() {
                utils.redo();
                done();
              });
            });

            it("changes line back to general", function(done) {
              var inner$ = helper.padInner$;

              // wait until line is changed to general
              helper.waitFor(function() {
                var $action = utils.getLine(LINE_OF_ACTION);
                var lineIsGeneralAgain = $action.find("action").length === 0;

                return lineIsGeneralAgain;
              }).done(function() {
                // just to make sure REDO was successful, test if pagination moved both generals
                // back to 1st page
                helper.waitFor(function() {
                  var $lineAfterPageBreak = inner$("div:has(nonSplitPageBreak)").next();
                  return utils.cleanText($lineAfterPageBreak.text()) === lastLineText;
                }).done(done);
              });
            });
          });
        });
      });
    });
  });

  context("when pad has a split element between two pages", function() {
    var FIRST_HALF = GENERALS_PER_PAGE - 3;
    var SECOND_HALF = GENERALS_PER_PAGE - 2;

    beforeEach(function(done) {
      this.timeout(60000);

      var inner$ = helper.padInner$;

      var line1 = utils.buildStringWithLength(59, "1") + ". ";
      var line2 = utils.buildStringWithLength(59, "2") + ". ";
      var line3 = utils.buildStringWithLength(59, "3") + ". ";
      var line4 = utils.buildStringWithLength(59, "4") + ". ";
      var lastLineText = line1 + line2 + line3 + line4;

      var singleLineGenerals = utils.buildScriptWithGenerals("general", GENERALS_PER_PAGE - 3);
      var multiLineGeneral   = utils.general(lastLineText);
      var script             = singleLineGenerals + multiLineGeneral;

      utils.createScriptWith(script, lastLineText, function() {
        // wait for line to be split by pagination
        helper.waitFor(function() {
          var $splitElementsWithPageBreaks = inner$("div splitPageBreak");
          return $splitElementsWithPageBreaks.length === 1;
        }, 2000).done(function() {
          // reload the pad so tests for UNDO work properly.
          // But first need to wait for changes of pagination to be saved
          setTimeout(function() {
            helper.newPad(done, padId);
          }, 1000);
        });
      });
    });

    context("and user changes 1st half from general to action", function() {
      beforeEach(function(done) {
        var inner$ = helper.padInner$;

        var $firstHalfOfMultiLineElement = inner$("div").last().prev();
        $firstHalfOfMultiLineElement.sendkeys('{selectall}{leftarrow}');

        // sets half to action
        utils.changeToElement(utils.ACTION, function() {
          // wait for 2nd half to be an action too
          helper.waitFor(function() {
            $secondHalfOfMultiLineElement = inner$("div").last();
            return $secondHalfOfMultiLineElement.find("action").length === 1;
          }).done(done);
        }, FIRST_HALF);
      });

      it("changes 2nd half of split element too", function(done) {
        var inner$ = helper.padInner$;

        $secondHalfOfMultiLineElement = inner$("div").last();
        var hasAction = $secondHalfOfMultiLineElement.find("action").length === 1;

        expect(hasAction).to.be(true);

        done();
      });

      context("then presses UNDO", function() {
        beforeEach(function(done) {
          // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("changes both halves back to general", function(done) {
          var inner$ = helper.padInner$;

          // wait until both halves are changed to general
          helper.waitFor(function() {
            $secondHalfOfMultiLineElement = inner$("div").last();
            $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
            var secondHalfIsGeneral = $secondHalfOfMultiLineElement.find("action").length === 0;
            var firstHalfIsGeneral = $firstHalfOfMultiLineElement.find("action").length === 0;

            return firstHalfIsGeneral && secondHalfIsGeneral;
          }).done(done);
        });

        context("then presses REDO again", function() {
          beforeEach(function(done) {
            var inner$ = helper.padInner$;

            // wait until both halves are changed to general
            helper.waitFor(function() {
              $secondHalfOfMultiLineElement = inner$("div").last();
              $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
              var secondHalfIsGeneral = $secondHalfOfMultiLineElement.find("action").length === 0;
              var firstHalfIsGeneral = $firstHalfOfMultiLineElement.find("action").length === 0;

              return firstHalfIsGeneral && secondHalfIsGeneral;
            }).done(function() {
              utils.redo();
              done();
            });
          });

          // FIXME: this context still breaks. Solution for other contexts does not work for this (why?!?!)
          xit("changes both halves back to action", function(done) {
            var inner$ = helper.padInner$;

            // wait until REDO is complete (and both halves are actions again)
            helper.waitFor(function() {
              $secondHalfOfMultiLineElement = inner$("div").last();
              $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
              var secondHalfIsAction = $secondHalfOfMultiLineElement.find("action").length === 1;
              var firstHalfIsAction = $firstHalfOfMultiLineElement.find("action").length === 1;

              return firstHalfIsAction && secondHalfIsAction;
            }).done(done);
          });
        });
      });

      context("then changes 1st half back from action to general", function() {
        beforeEach(function(done) {
          var inner$ = helper.padInner$;

          var $firstHalfOfMultiLineElement = inner$("div").last().prev();
          $firstHalfOfMultiLineElement.sendkeys('{selectall}{leftarrow}');

          // sets half to general
          utils.changeToElement(utils.GENERAL, done, FIRST_HALF);
        });

        it("changes 2nd half of split element too", function(done) {
          var inner$ = helper.padInner$;

          // wait for 2nd half to be a general too
          helper.waitFor(function() {
            $secondHalfOfMultiLineElement = inner$("div").last();
            return $secondHalfOfMultiLineElement.find("action").length === 0;
          }).done(done);
        });

        context("then presses UNDO", function() {
          beforeEach(function(done) {
            // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
            setTimeout(function() {
              utils.undo();
              done();
            }, 1000);
          });

          it("changes both halves back to action", function(done) {
            var inner$ = helper.padInner$;

            // wait until both halves are changed to action
            helper.waitFor(function() {
              $secondHalfOfMultiLineElement = inner$("div").last();
              $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
              var secondHalfIsAction = $secondHalfOfMultiLineElement.find("action").length === 1;
              var firstHalfIsAction = $firstHalfOfMultiLineElement.find("action").length === 1;

              return firstHalfIsAction && secondHalfIsAction;
            }).done(done);
          });

          context("then presses REDO again", function() {
            beforeEach(function(done) {
              var inner$ = helper.padInner$;

              // wait until both halves are changed to action
              helper.waitFor(function() {
                $secondHalfOfMultiLineElement = inner$("div").last();
                $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
                var secondHalfIsAction = $secondHalfOfMultiLineElement.find("action").length === 1;
                var firstHalfIsAction = $firstHalfOfMultiLineElement.find("action").length === 1;

                return firstHalfIsAction && secondHalfIsAction;
              }).done(function() {
                utils.redo();
                done();
              });
            });

            it("changes both halves back to general", function(done) {
              var inner$ = helper.padInner$;

              // wait until REDO is complete (and both halves are generals again)
              helper.waitFor(function() {
                $secondHalfOfMultiLineElement = inner$("div").last();
                $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
                var secondHalfIsGeneral = $secondHalfOfMultiLineElement.find("action").length === 0;
                var firstHalfIsGeneral = $firstHalfOfMultiLineElement.find("action").length === 0;

                return firstHalfIsGeneral && secondHalfIsGeneral;
              }).done(done);
            });
          });
        });
      });
    });

    context("and user changes 2nd half from general to action", function() {
      beforeEach(function(done) {
        var inner$ = helper.padInner$;

        var $secondHalfOfMultiLineElement = inner$("div").last();
        $secondHalfOfMultiLineElement.sendkeys('{selectall}{rightarrow}');

        // sets half to action
        utils.changeToElement(utils.ACTION, function() {
          // wait for 2nd half to be an action too
          helper.waitFor(function() {
            $firstHalfOfMultiLineElement = inner$("div").last().prev();
            return $firstHalfOfMultiLineElement.find("action").length === 1;
          }).done(done);
        }, SECOND_HALF);
      });

      it("changes 1st half of split element too", function(done) {
        var inner$ = helper.padInner$;

        $firstHalfOfMultiLineElement = inner$("div").last().prev();
        var hasAction = $firstHalfOfMultiLineElement.find("action").length === 1;

        expect(hasAction).to.be(true);

        done();
      });

      context("then presses UNDO", function() {
        beforeEach(function(done) {
          // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
          setTimeout(function() {
            utils.undo();
            done();
          }, 1000);
        });

        it("changes both halves back to general", function(done) {
          var inner$ = helper.padInner$;

          // wait until both halves are changed to general
          helper.waitFor(function() {
            $secondHalfOfMultiLineElement = inner$("div").last();
            $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
            var secondHalfIsGeneral = $secondHalfOfMultiLineElement.find("action").length === 0;
            var firstHalfIsGeneral = $firstHalfOfMultiLineElement.find("action").length === 0;

            return firstHalfIsGeneral && secondHalfIsGeneral;
          }).done(done);
        });
      });

      context("then changes 2nd half back from action to general", function() {
        beforeEach(function(done) {
          var inner$ = helper.padInner$;

          var $secondHalfOfMultiLineElement = inner$("div").last();
          $secondHalfOfMultiLineElement.sendkeys('{selectall}{rightarrow}');

          // sets half to general
          utils.changeToElement(utils.GENERAL, done, SECOND_HALF);
        });

        it("changes 1st half of split element too", function(done) {
          var inner$ = helper.padInner$;

          // wait for 1st half to be a general too
          helper.waitFor(function() {
            $firstHalfOfMultiLineElement = inner$("div").last().prev();
            return $firstHalfOfMultiLineElement.find("action").length === 0;
          }).done(done);
        });

        context("then presses UNDO", function() {
          beforeEach(function(done) {
            // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
            setTimeout(function() {
              utils.undo();
              done();
            }, 1000);
          });

          it("changes both halves back to action", function(done) {
            var inner$ = helper.padInner$;

            // wait until both halves are changed to action
            helper.waitFor(function() {
              $secondHalfOfMultiLineElement = inner$("div").last();
              $firstHalfOfMultiLineElement = $secondHalfOfMultiLineElement.prev();
              var secondHalfIsAction = $secondHalfOfMultiLineElement.find("action").length === 1;
              var firstHalfIsAction = $firstHalfOfMultiLineElement.find("action").length === 1;

              return firstHalfIsAction && secondHalfIsAction;
            }).done(done);
          });
        });
      });
    });
  });
});