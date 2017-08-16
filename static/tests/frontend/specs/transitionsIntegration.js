describe("ep_script_elements - integration with ep_script_element_transitions", function() {
  var utils, apiUtils;

  before(function(done) {
    utils = ep_script_elements_test_helper.utils;
    apiUtils = ep_script_elements_test_helper.apiUtils;
    helper.newPad(function() {
      utils.cleanPad(function() {
        // choose initial line type, to test UNDO later
        utils.changeToElement(utils.ACTION, function(){
          apiUtils.startListeningToApiEvents();
          done();
        });
      });
    });

    this.timeout(60000);
  });

  context('when user changes action into another type by using shortcut', function() {
    before(function(done) {
      var typeShortcutToChangeToCharacter = ep_script_element_transitions_test_helper.commandNumber.buildShortcut(3);
      typeShortcutToChangeToCharacter();
      done();
    });

    it('sends the elementType to the API', function(done) {
      apiUtils.waitForApiToSend(utils.CHARACTER, done);
    });

    context('and user triggers UNDO', function() {
      before(function() {
        // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
        setTimeout(utils.undo, 1000);
      });

      it('sends the current caret element as elementType to the API', function(done) {
        apiUtils.waitForApiToSend(utils.ACTION, done);
      });
    });
  });
});
