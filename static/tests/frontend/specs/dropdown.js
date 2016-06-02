// Letter
// var GENERALS_PER_PAGE = 54;

// A4
var GENERALS_PER_PAGE = 58;

describe("ep_script_elements - dropdown", function(){
  var utils;
  before(function(){
    utils = ep_script_elements_test_helper.utils;
  });

  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(function(){
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

  context("when pad has lines with different element types", function() {
    beforeEach(function(cb) {
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
    var utils;

    before(function() {
      utils = ep_script_scene_marks_test_helper.utils;
    });

    beforeEach(function(cb) {
      var actLines = [0]; // creates act and sequence in the 1st heading
      var seqLines = [];
      var numOfHeadings = 1;
      helper.newPad(function(){
        utils.writeScenesWithSceneMarks(actLines, seqLines, numOfHeadings, function(){
          utils.clickOnSceneMarkButtonOfLine(4);
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

  context("when caret is in a heading with scene mark", function(){
    var sceneMarkUtils;

    before(function() {
      sceneMarkUtils = ep_script_scene_marks_test_helper.utils;
    });

    beforeEach(function(cb) {
      var actLines = [0]; // creates act and sequence in the 1st heading
      var seqLines = [];
      var numOfHeadings = 1;
      helper.newPad(function(){
        sceneMarkUtils.writeScenesWithSceneMarks(actLines, seqLines, numOfHeadings, function(){
          utils.placeCaretInTheBeginningOfLine(4, cb);
        });
      });
      this.timeout(10000);
    });

    context("and change to another element", function(){

      beforeEach(function(cb){
        // changes from heading to parenthetical
        utils.changeToElement(utils.PARENTHETICAL, cb);
      });

      it("removes the scene mark", function(done){
        helper.waitFor(function(){
          var inner$ = helper.padInner$;
          var sceneMarks = inner$("div").length;

          // ensure there are 2 elements: a parenthetical the was created
          // by the dropdown and the action which already existed before
          return sceneMarks === 2;
        }).done(function(){

          // double check, check the types and texts
          utils.validateLineTextAndType(0, "SCENE 0", 'parenthetical');
          utils.validateLineTextAndType(1, "action from SCENE 0 0", "action");
          done();
        });
      });

      context("and user performs undo", function(){
        beforeEach(function(cb){
          utils.undo();
          cb();
        });

        it("displays the heading with the original scene marks", function(done){
          helper.waitFor(function(done){
            var inner$ = helper.padInner$;
            var hasHeading = inner$("heading").length !== 0;
            return hasHeading;
          }).done(function(){
            utils.validateLineTextAndType(0, "ACT OF undefined", 'act_name');
            utils.validateLineTextAndType(1, "SUMMARY OF ACT OF undefined", 'act_summary');
            utils.validateLineTextAndType(2, "SEQUENCE OF undefined", 'sequence_name');
            utils.validateLineTextAndType(3, "SUMMARY OF SEQUENCE OF undefined", 'sequence_summary');
            utils.validateLineTextAndType(4, "SCENE 0", 'heading');
            utils.validateLineTextAndType(5, "action from SCENE 0 0", 'action');
            done();
          });
        });
      });

    });
  });

});