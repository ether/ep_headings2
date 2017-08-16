describe('ep_script_elements - place caret on first script element when it loads the script', function () {
  var apiUtils, utils, padId;
  before(function (done) {
    utils = ep_script_elements_test_helper.utils;
    apiUtils = ep_script_elements_test_helper.apiUtils;
    helperFunctions = ep_script_elements_test_helper.placeCaretOnFirstSeOnLoad;
    padId = helper.newPad(function(){
      apiUtils.startListeningToApiEvents();
      helperFunctions.createPadWithSM(done);
    });
    this.timeout(6000);
  });

  context("when it reloads a pad", function(){
    context("and first element is a scene mark", function(){
      before(function (done) {
        helper.newPad(done, padId);
        this.timeout(10000);
      });

      after(function (done) {
        utils.cleanPad(done);
      });

      it('places the caret in the first heading', function(done) {
        helper.waitFor(function(){
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          return $lineWhereCaretIs.find('heading').length;
        }).done(done)
      });
    });

    context("and first element is a script element", function(){
      var self = this;
      before(function (done) {
        helperFunctions.createPadWithSE(function(){
          self.setTimeout(function() { // we have to wait a little to save the changes
            helper.newPad(done, padId);
          }, 1000);
        });
        this.timeout(10000);
      });

      it('keeps the caret on the first script element', function(done) {
        self.setTimeout(function() {
          var $lineWhereCaretIs = utils.getLineWhereCaretIs();
          var caretIsOnAction = $lineWhereCaretIs.find('action').length === 1;
          expect(caretIsOnAction).to.be(true);
          done();
        }, 1000);
      });
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.placeCaretOnFirstSeOnLoad = {
  createPadWithSM: function(done) {
    var utils = ep_script_elements_test_helper.utils;

    var sceneText = "scene";
    var act = utils.act(sceneText);
    var sequence = utils.sequence(sceneText);
    var synopsis = utils.synopsis(sceneText);
    var lastLineText = "heading";
    var heading = utils.heading(lastLineText);

    var script = act + sequence + synopsis + heading;
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
}

