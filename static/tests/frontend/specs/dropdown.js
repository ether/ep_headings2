// Letter
// var GENERALS_PER_PAGE = 54;

// A4
var GENERALS_PER_PAGE = 58;

describe("ep_script_elements - dropdown", function(){
  var utils, SMUtils, helperFunctions, padId;
  before(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.dropdown;
    SMUtils = ep_script_scene_marks_test_helper.utils;
    padId = helper.newPad(function(){
      helper.waitFor(function(){
        var pluginIsNotLoaded = (undefined === helper.padChrome$.window.clientVars.plugins.plugins.ep_script_scene_marks);
        return !pluginIsNotLoaded;
      }).done(cb)
    });
    this.timeout(60000);
  });

  it("changes option select when script element is changed", function(done) {
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    utils.changeToElement(utils.ACTION);

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("action").length === 1;
    }).done(done);
  });

  it("clears style when General is selected", function(done) {
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    utils.changeToElement(utils.ACTION);

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("action").length === 1;
    }).done(function(){
      // sets first line to general
      utils.changeToElement(utils.GENERAL);

      helper.waitFor(function(){
        // wait for element to be processed and changed
        $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
        return $firstTextElement.find("action").length === 0;
      }).done(done);
    });
  });

  context("when it reloads a pad", function(){
    context("and first element is a scene mark", function(){
      var eventTriggered = false;
      before(function (done) {
        helperFunctions.createPadWithSM(function(){
          // to test if the dropdown has changed we have to validate the text of the dropdown
          // and if the event which makes the this value changed was triggered
          var chrome$ = helper.padChrome$;
          chrome$('#script_element-selection').on('selectElementChange', function() {
            eventTriggered = true;
          });
          done();
        });
      });

      after(function (done) {
        utils.cleanPad(done);
      });

      it('changes the value on the dropdown', function(done) {
        this.timeout(10000);
        setTimeout(function() {
          // reload the pad
          helper.newPad(function(){
            // wait for the event which changes the dropdown value to be triggered
            helper.waitFor(function(){
              return eventTriggered;
            }).done(function(){
              helperFunctions.waitDropdownChangeToElement("Heading", done);
            });
          }, padId);
        }, 1000);
      });
    });

    context("and first element is a script element", function(){
      var eventTriggered = false;
      before(function (done) {
        helperFunctions.createPadWithSE(function(){
          // to test if the dropdown has changed we have to validate the text of the dropdown
          // and if the event which makes the this value changed was triggered
          var chrome$ = helper.padChrome$;
          chrome$('#script_element-selection').on('selectElementChange', function() {
            eventTriggered = true;
          });
          done();
        });
      });

      after(function (done) {
        utils.cleanPad(done);
      });

      it('changes the value on the dropdown to the first script element', function(done) {
        this.timeout(10000);
        setTimeout(function() {
          // reload the pad
          helper.newPad(function(){
            // wait for the event which changes the dropdown value to be triggered
            helper.waitFor(function(){
              return eventTriggered;
            }).done(function(){
              helperFunctions.waitDropdownChangeToElement("Action", done);
            });
          }, padId);
        }, 1000);
      });
    });
  });

  context("when pad has lines with different element types", function() {
    before(function(cb) {
      var inner$ = helper.padInner$;
      var $firstTextElement = inner$("div").first();

      // faster way to create two lines (1st is a scene heading, 2nd is an action)
      var firstLine = "<dialogue>First Line!</dialogue><br/>";
      var secondLine = "<action>Second Line!</action><br/>";
      $firstTextElement.html(firstLine + secondLine);

      // wait for Etherpad to finish processing lines
      helper.waitFor(function(){
        $secondTextElement = inner$("div").first().next();
        return $secondTextElement.text() === "Second Line!";
      }, 2000).done(cb);
    });

    it("sets select value according to the line caret is", function(done) {
      // this is a longer test, might need more time to finish
      this.timeout(10000);

      var chrome$ = helper.padChrome$;
      var inner$ = helper.padInner$;

      // places caret on dialogue
      var $heading = inner$("div").first();
      $heading.sendkeys("{selectall}");

      // validate select shows "Dialogue"
      helper.waitFor(function() {
        var selectedValue = chrome$('#script_element-selection option:selected').text();
        return selectedValue === "Dialogue";
      }, 2000).done(function() {
        // places caret on action
        var $action = inner$("div").first().next();
        $action.sendkeys("{selectall}");

        // validate select shows "Action"
        helper.waitFor(function() {
          var selectedValue = chrome$('#script_element-selection option:selected').text();
          return selectedValue === "Action";
        }, 2000).done(done);
      });
    });

    it("triggers event 'selectElementChange' when select value is changed", function(done) {
      // this is a longer test, might need more time to finish
      this.timeout(10000);

      var chrome$ = helper.padChrome$;
      var inner$ = helper.padInner$;

      // places caret on Dialogue to force select value to not be "Action"
      var $heading = inner$("div").first();
      $heading.sendkeys("{selectall}");

      helper.waitFor(function() {
        var selectedValue = chrome$('#script_element-selection option:selected').text();
        return selectedValue === "Dialogue";
      }, 2000).done(function() {
        // listens to 'selectElementChange' event
        var eventTriggered = false;
        chrome$('#script_element-selection').on('selectElementChange', function() {
          eventTriggered = true;
        });

        // places caret on action so event can be triggered
        var $action = inner$("div").first().next();
        $action.sendkeys("{selectall}");

        // validate event was triggered
        helper.waitFor(function() {
          return eventTriggered;
        }, 3000).done(done);
      });
    });

  });

  context("when caret is in a scene mark", function(){
    before(function(cb) {
      var actLines = [0]; // creates act and sequence in the 1st heading
      var seqLines = [];
      var numOfHeadings = 1;
      utils.cleanPad(function(){
        SMUtils.writeScenesWithSceneMarks(actLines, seqLines, numOfHeadings, function(){
          SMUtils.clickOnSceneMarkButtonOfLine(4);
          cb();
        });
      });
      this.timeout(10000);
    });

    var sceneMarks = ['act_name', 'act_summary', 'sequence_name', 'sequence_summary'];
    sceneMarks.forEach(function(sceneMark){

      context("and sceneMark is " + sceneMark , function(){

        it("displays 'style' on the dropdown", function(done){

          var inner$ = helper.padInner$;

          // places caret on action
          var $action = inner$("div").last();
          $action.sendkeys("{selectall}");
          this.timeout(10000);
          // validate select shows "Action"
          helper.waitFor(function() {
            var chrome$ = helper.padChrome$;
            var selectedValue = chrome$('#script_element-selection option:selected').text();
            return selectedValue === "Action";
          }, 2000).done(function() {
            var inner$ = helper.padInner$;
            var $targetElement = inner$(sceneMark).parent();
            $targetElement.sendkeys("{selectall}");

            helper.waitFor(function() {
              var chrome$ = helper.padChrome$;
              var selectedValue = chrome$('#script_element-selection option:selected').text();
              return selectedValue === "Style";
            }, 2000).done(done);
          });

        });

      });
    });
  });

  context("when has a selection begins in a SE and includes a SM", function(){
    // create a pad beginning with a SE
    beforeEach(function(done){
      utils.cleanPad(function(){
        helperFunctions.createPadWithSEandSM(function(){
          // make SM visible
          var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 0);
          SMUtils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);
          var inner$ = helper.padInner$;

          // selects since the first line
          var $firstElement = inner$("div").first();
          var $lastElement = inner$('div:has(sequence_summary)').last();
          var lastLineLength = $lastElement.text().length;
          var offsetAtFirstElement = 0;
          var offsetAtlastElement = lastLineLength;

          // make the selection
          helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);
          done();
        });
      })
      this.timeout(6000);
    });
    context("and user changes the element on dropdown", function(){
      it("does not add SE attribute on SM", function(done){
        utils.changeToElement(utils.ACTION);

        // the general changes to an action
        utils.validateLineTextAndType(0, "general", "action");

        // SM should not include SM tag inside
        helperFunctions.checkIfHasTagOnLines(1, 4, "action");
        done();
      });

    });
  });

  // this context test only one case but the reason why this happens affects other scenarios
  // all of them happen for the same reason, though. We need to remove the SE before add a new one.
  context("when it changes to a element and user performs undo", function(){
    before(function (done) {
      utils.cleanPad(function(){
        helperFunctions.createElement("character", function(){
          helperFunctions.changeLineToElement(0, utils.ACTION, function(){
            utils.undo();
            done();
          });
        });
      });
      this.timeout(60000);
    });

    it("returns to the original element", function(done){
      helper.waitFor(function() {
        var selectedValue = helper.padChrome$('#script_element-selection option:selected').text();
        return selectedValue === "Character";
      }, 2000).done(done);
    })
  })
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.dropdown = {
  createPadWithSEandSM: function(done){
    var utils = ep_script_elements_test_helper.utils;
    var SMUtils = ep_script_scene_marks_test_helper.utils;

    var general = utils.general("general");
    var sceneText = "scene";
    var act = SMUtils.act(sceneText);
    var sequence = SMUtils.sequence(sceneText);
    var lastLineText = "heading";
    var heading = utils.heading(lastLineText);

    var script = general + act + sequence + heading;
    utils.createScriptWith(script, lastLineText, done);
  },
  createPadWithSM: function(done) {
    var utils = ep_script_elements_test_helper.utils;
    var SMUtils = ep_script_scene_marks_test_helper.utils;

    var sceneText = "scene";
    var act = SMUtils.act(sceneText);
    var sequence = SMUtils.sequence(sceneText);
    var lastLineText = "heading";
    var heading = utils.heading(lastLineText);

    var script = act + sequence + heading;
    utils.createScriptWith(script, lastLineText, done);
  },
  createPadWithSE: function(done) {
    var utils = ep_script_elements_test_helper.utils;

    var lastLineText = "general";
    var action = utils.action("action");
    var general = utils.general(lastLineText);

    var script = action + general;
    utils.createScriptWith(script, lastLineText, done);
  },
  waitDropdownChangeToElement: function(element, cb) {
    helper.waitFor(function() {
      var chrome$ = helper.padChrome$;
      var selectedValue = chrome$('#script_element-selection option:selected').text();
      return selectedValue === element;
    }, 2000).done(cb);
  },
  createElement: function(element, cb) {
    var line = "<"+ element + ">Line!</"+ element + "><br/>";
    var inner$ = helper.padInner$;
    var $firstTextElement = inner$("div").first();

    $firstTextElement.html(line);
    cb();
  },
  changeLineToElement: function(line, element, cb) {
    var utils = ep_script_elements_test_helper.utils;
    var $line = helper.padInner$("div").slice(line, line + 1);
    $line.sendkeys("{selectall}");

    setTimeout(function() {
      utils.changeToElement(element);

      helper.waitFor(function(){
        var $line = helper.padInner$("div").slice(line, line + 1);
        return $line.find(element).length === 1;
      }).done(cb);
    }, 1000);
  },
  // interval = 1, only one line
  // interval = 2, two lines
  checkIfHasTagOnLines(lineStart, interval, tag){
    var inner$ = helper.padInner$;
    var $lines = inner$("div").slice(lineStart, lineStart + interval);
    var hasTagOnLines = $lines.find(tag).length !== 0;
    expect(hasTagOnLines).to.be(false);
  }
}