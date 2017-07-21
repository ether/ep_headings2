// Letter
// var GENERALS_PER_PAGE = 54;

// A4
var GENERALS_PER_PAGE = 58;
var CHANGE_CARET_ELEMENT_MESSAGE_TYPE = 'dropdown_caret_element_changed';

describe("ep_script_elements - API - dropdown caret element changed", function(){
  var utils, SMUtils, helperFunctions, padId, apiUtils;
  before(function(cb){
    utils = ep_script_elements_test_helper.utils;
    apiUtils = ep_script_elements_test_helper.apiUtils;
    helperFunctions = ep_script_elements_test_helper.dropdown;
    SMUtils = ep_script_scene_marks_test_helper.utils;
    padId = helper.newPad(function(){
      apiUtils.startListeningToApiEvents();
      helper.waitFor(function(){
        var pluginIsNotLoaded = (undefined === helper.padChrome$.window.clientVars.plugins.plugins.ep_script_scene_marks);
        return !pluginIsNotLoaded;
      }).done(cb);
    });
    this.timeout(60000);
  });

  it("changes the line type when API receives a message that line type has changed", function(done) {
    this.timeout(6000);
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to action
    apiUtils.simulateTriggerOfDropdownChanged(utils.ACTION);

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("action").length === 1;
    }, 4000).done(done);
  });

  context('when API receives a message that line type has changed to general', function(){
    before(function (done) {
      var inner$ = helper.padInner$;
      utils.cleanPad(function(){
        var $firstTextElement = inner$("div").first();
        $firstTextElement.sendkeys('First Line!');

        // sets first line to heading
        apiUtils.simulateTriggerOfDropdownChanged(utils.HEADING);

        helper.waitFor(function(){
          // wait for element to be processed and changed
          // $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
          var $lineChanged = utils.getLine(2);
          return $lineChanged.find("heading").length === 1;
        }).done(function(){
          // sets first line to general
          apiUtils.simulateTriggerOfDropdownChanged(utils.GENERAL);
          done();
        });
      });
    });

    it("removes the script element attributes", function(done) {
      helper.waitFor(function(){
        // wait for element to be processed and changed
        var inner$ = helper.padInner$;
        var $firstTextElement = inner$("div").first();
        return $firstTextElement.find("heading").length === 0;
      }).done(done);
    });

    context('and the element changed is a heading', function(){
      it('does not show a "*"', function(done){
        var inner$ = helper.padInner$;
        var $firstTextElement = inner$("div").first();
        expect($firstTextElement.text()).to.be("First Line!");
        done();
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
        var $secondTextElement = inner$("div").first().next();
        return $secondTextElement.text() === "Second Line!";
      }, 2000).done(function(){
        apiUtils.waitForDataToBeSent(CHANGE_CARET_ELEMENT_MESSAGE_TYPE, cb);
      });
    });

    it('sends the element type according to the line caret is', function(done) {
      // this is a longer test, might need more time to finish
      this.timeout(10000);

      // places caret on dialogue
      var inner$ = helper.padInner$;
      var $dialogue = inner$("div").first();
      $dialogue.sendkeys("{selectall}");

      apiUtils.waitForApiToSend('dialogue', function() {
        var $action = inner$("div").first().next();
        $action.sendkeys("{selectall}");
        apiUtils.waitForApiToSend('action', done);
      });
    });
  });

  context("when caret is in a scene mark", function(){
    before(function(cb) {
      var epLines = [0];
      var actLines = []; // creates act and sequence in the 1st heading
      var seqLines = [];
      var numOfHeadings = 1;
      var headingLine = 8;
      utils.cleanPad(function(){
        SMUtils.writeScenesWithSceneMarks(epLines, actLines, seqLines, numOfHeadings, function(){
          SMUtils.clickOnSceneMarkButtonOfLine(headingLine);
          apiUtils.waitForDataToBeSent(CHANGE_CARET_ELEMENT_MESSAGE_TYPE, cb);
        });
      });
      this.timeout(10000);
    });

    var sceneMarks = ['episode_name', 'episode_summary','act_name', 'act_summary', 'sequence_name', 'sequence_summary', 'scene_name', 'scene_summary'];
    sceneMarks.forEach(function(sceneMark){

      context("and sceneMark is " + sceneMark , function(){

        it('sends "undefined" as the elementType', function(done){

          var inner$ = helper.padInner$;
          // places caret on action
          var $action = inner$("div").last();
          $action.sendkeys("{selectall}");
          this.timeout(10000);
          apiUtils.waitForApiToSend('action', function() {
            var inner$ = helper.padInner$;
            var $targetElement = inner$(sceneMark).parent();
            $targetElement.sendkeys("{selectall}");
            apiUtils.waitForApiToSend(undefined, done);
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
    context("and API receives a message that caret element has changed", function(){
      it("does not add SE attribute on SM", function(done){
        apiUtils.simulateTriggerOfDropdownChanged(utils.ACTION);
        helper.waitFor(function() {
          var inner$ = helper.padInner$;
          return inner$.find('action').length;
        }).done(function(){
          // the general changes to an action
          utils.validateLineTextAndType(0, "general", "action");

          // SM should not include SM tag inside
          helperFunctions.checkIfHasTagOnLines(1, 4, "action");
          done();
        })
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
        return helper.padInner$.find('character').length;
      }, 2000).done(done);
    })
  });
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
    var synopsis = utils.synopsis(sceneText);
    var lastLineText = "heading";
    var heading = utils.heading(lastLineText);

    var script = general + act + sequence + synopsis + heading;
    utils.createScriptWith(script, lastLineText, done);
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
    var apiUtils = ep_script_elements_test_helper.apiUtils;
    var $line = helper.padInner$('div').eq(line);
    $line.sendkeys("{selectall}");

    setTimeout(function() {
      apiUtils.simulateTriggerOfDropdownChanged(element);

      helper.waitFor(function(){
        var $line = helper.padInner$('div').eq(line);
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
