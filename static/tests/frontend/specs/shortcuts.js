describe("ep_script_elements - shortcuts", function() {
  var utils, pressShortcutToNextScene, pressShortcutToPreviousScene;

  beforeEach(function(cb) {
    utils = ep_script_elements_test_helper.utils;
    pressShortcutToNextScene = ep_script_elements_test_helper.shortcuts.pressShortcutToNextScene;
    pressShortcutToPreviousScene = ep_script_elements_test_helper.shortcuts.pressShortcutToPreviousScene;

    helper.newPad(function(){
      utils.cleanPad(cb);
    });
    this.timeout(60000);
  });

  context("when script has more than one scene", function() {
    var ACTION_BEFORE_FIRST_SCENE = 0;
    var FIRST_SCENE = 5; // we have act and summary before
    var SECOND_SCENE = 8;
    var THIRD_SCENE = LAST_SCENE = 11;
    var FIRST_ACTION_OF_LAST_SCENE = 12;

    beforeEach(function(cb) {
      ep_script_elements_test_helper.shortcuts.createScriptWithThreeScenes(cb);
    });

    context("and caret is on action before first scene", function() {
      beforeEach(function(cb) {
        utils.placeCaretOnLine(ACTION_BEFORE_FIRST_SCENE, cb);
      });

      it("moves caret to heading of first scene when Cmd+] is pressed", function(done) {
        pressShortcutToNextScene();

        // wait for caret to be moved to correct scene
        helper.waitFor(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var $firstScene = utils.getLine(FIRST_SCENE);

          // we need to compare DOM elements instead of jQuery ones
          return $lineWhereCaretIs.get(0) === $firstScene.get(0);
        }).done(done);
      });

      it("does not move caret when Cmd+[ is pressed", function(done) {
        pressShortcutToPreviousScene();

        helper.waitFor(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var $originalLine = utils.getLine(ACTION_BEFORE_FIRST_SCENE);

          // we need to compare DOM elements instead of jQuery ones
          return $lineWhereCaretIs.get(0) === $originalLine.get(0);
        }).done(done);
      });
    });

    context("and caret is on line of second scene heading", function() {
      beforeEach(function(cb) {
        utils.placeCaretOnLine(SECOND_SCENE, cb);
      });

      it("moves caret to heading of third scene when Cmd+] is pressed", function(done) {
        pressShortcutToNextScene();

        // wait for caret to be moved to correct scene
        helper.waitFor(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var $thirdScene = utils.getLine(THIRD_SCENE);

          // we need to compare DOM elements instead of jQuery ones
          return $lineWhereCaretIs.get(0) === $thirdScene.get(0);
        }).done(done);
      });

      it("moves caret to heading of first scene when Cmd+[ is pressed", function(done) {
        pressShortcutToPreviousScene();

        // wait for caret to be moved to correct scene
        helper.waitFor(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var $firstScene = utils.getLine(FIRST_SCENE);

          // we need to compare DOM elements instead of jQuery ones
          return $lineWhereCaretIs.get(0) === $firstScene.get(0);
        }).done(done);
      });

      context("and there is no content before first scene", function() {
        beforeEach(function(cb) {
          var inner$ = helper.padInner$;

          // remove first line
          inner$("div").first().remove();

          cb();
        });

        it("moves caret to heading of first scene when Cmd+[ is pressed", function(done) {
          pressShortcutToPreviousScene();

          // wait for caret to be moved to correct scene
          helper.waitFor(function() {
            var $lineWhereCaretIs = utils.getLineWhereCaretIs();

            // 1st scene is now on first line visible (4), we have act and sequence not visible
            var $firstScene = utils.getLine(4);

            // we need to compare DOM elements instead of jQuery ones
            return $lineWhereCaretIs.get(0) === $firstScene.get(0);
          }).done(done);
        });
      });
    });

    context("and caret is on line after the last scene heading", function() {
      beforeEach(function(cb) {
        utils.placeCaretOnLine(FIRST_ACTION_OF_LAST_SCENE, cb);
      });

      it("does not move caret when Cmd+] is pressed", function(done) {
        pressShortcutToNextScene();

        helper.waitFor(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var $originalLine = utils.getLine(FIRST_ACTION_OF_LAST_SCENE);

          // we need to compare DOM elements instead of jQuery ones
          return $lineWhereCaretIs.get(0) === $originalLine.get(0);
        }).done(done);
      });

      it("moves caret to heading of last scene when Cmd+[ is pressed", function(done) {
        pressShortcutToPreviousScene();

        // wait for caret to be moved to correct scene
        helper.waitFor(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var $firstScene = utils.getLine(LAST_SCENE);

          // we need to compare DOM elements instead of jQuery ones
          return $lineWhereCaretIs.get(0) === $firstScene.get(0);
        }).done(done);
      });
    });

  });

  context("when script has no scene", function() {
    var ACTION_IN_THE_MIDDLE = 1;

    beforeEach(function(cb) {
      ep_script_elements_test_helper.shortcuts.createScriptWithNoScene(function() {
        utils.placeCaretOnLine(ACTION_IN_THE_MIDDLE, cb);
      });
    });

    it("does not move caret when Cmd+] is pressed", function(done) {
      pressShortcutToNextScene();

      helper.waitFor(function() {
        var $lineWhereCaretIs = utils.getLineWhereCaretIs();
        var $originalLine = utils.getLine(ACTION_IN_THE_MIDDLE);

        // we need to compare DOM elements instead of jQuery ones
        return $lineWhereCaretIs.get(0) === $originalLine.get(0);
      }).done(done);
    });

    it("does not move caret when Cmd+[ is pressed", function(done) {
      pressShortcutToPreviousScene();

      helper.waitFor(function() {
        var $lineWhereCaretIs = utils.getLineWhereCaretIs();
        var $originalLine = utils.getLine(ACTION_IN_THE_MIDDLE);

        // we need to compare DOM elements instead of jQuery ones
        return $lineWhereCaretIs.get(0) === $originalLine.get(0);
      }).done(done);
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.shortcuts = {
  createScriptWithThreeScenes: function(cb) {
    var utils = ep_script_elements_test_helper.utils;

    // build script with 3 scenes and an action before first scene
    // WARNING!! If you change the elements of this script, be sure you've changed the
    // indexes of the test (ACTION_BEFORE_FIRST_SCENE, FIRST_ACTION_OF_LAST_SCENE, etc)
    var beforeScene1 = utils.action("Action 0.1");
    var scene1 = utils.heading("Scene 1") + utils.action("Action 1.1") + utils.action("Action 1.2");
    var scene2 = utils.heading("Scene 2") + utils.action("Action 2.1") + utils.action("Action 2.2");
    var scene3 = utils.heading("Scene 3") + utils.action("Action 3.1") + utils.action("Action 3.2");
    var script = beforeScene1 + scene1 + scene2 + scene3;
    utils.createScriptWith(script, "Action 3.2", cb);
  },
  createScriptWithNoScene: function(cb) {
    var utils = ep_script_elements_test_helper.utils;

    // build script with only 3 actions, no scene at all
    var script = utils.action("Action 1") + utils.action("Action 2") + utils.action("Action 3");
    utils.createScriptWith(script, "Action 3", cb);
  },

  pressShortcutToNextScene: function() {
    var mac  = ep_script_elements_test_helper.shortcuts.isMac();
    var nextScene = mac ? 221 : 220;
    ep_script_elements_test_helper.shortcuts.buildShortcut(nextScene); // Cmd+]
  },
  pressShortcutToPreviousScene: function() {
    var mac  = ep_script_elements_test_helper.shortcuts.isMac();
    var previousScene = mac ? 219 : 221;
    ep_script_elements_test_helper.shortcuts.buildShortcut(previousScene); // Cmd+[
  },
  buildShortcut: function(keyCode) {
    var inner$ = helper.padInner$;
    if(inner$(window)[0].bowser.firefox || inner$(window)[0].bowser.modernIE){ // if it's a mozilla or IE
      var evtType = "keypress";
    }else{
      var evtType = "keydown";
    }
    var e = inner$.Event(evtType);
    e.ctrlKey = true;
    e.keyCode = keyCode;
    inner$("#innerdocbody").trigger(e);
  },
  isMac: function() {
    var inner$ = helper.padInner$;
    var isMac = inner$(window)[0].bowser.mac ? true : false
    return isMac;
  },
};
