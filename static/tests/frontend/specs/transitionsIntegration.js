describe("ep_script_elements - integration with ep_script_element_transitions", function() {
  var utils;

  before(function(done) {
    utils = ep_script_elements_test_helper.utils;

    helper.newPad(function() {
      utils.cleanPad(function() {
        // choose initial line type, to test UNDO later
        utils.changeToElement(utils.ACTION, done);
      });
    });

    this.timeout(60000);
  });

  context('when user changes action into another type by using shortcut', function() {
    var testDropdownValueIs = function(type, done) {
      helper.waitFor(function(){
        return helper.padChrome$('#script_element-selection').val() === utils.valOf(type);
      }, 2000).done(done);
    }

    before(function(done) {
      var typeShortcutToChangeToCharacter = ep_script_element_transitions_test_helper.commandNumber.buildShortcut(3);
      typeShortcutToChangeToCharacter();
      done();
    });

    it('updates dropdown value to reflect new line type', function(done) {
      testDropdownValueIs(utils.CHARACTER, done);
    });

    context('and user triggers UNDO', function() {
      before(function() {
        // we need to wait for the change to be completely saved, otherwise UNDO will not work properly
        setTimeout(utils.undo, 1000);
      });

      it('updates dropdown value to reflect original line type', function(done) {
        testDropdownValueIs(utils.ACTION, done);
      });
    });
  });
});