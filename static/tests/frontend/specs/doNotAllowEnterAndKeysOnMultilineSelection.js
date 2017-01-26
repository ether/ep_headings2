describe('ep_script_elements - prevent ENTER and chars to be processed when selection includes multiple lines', function() {
  var utils, helperFunctions, sceneMarkUtils;

  before(function(done) {
    sceneMarkUtils  = ep_script_scene_marks_test_helper.utils;
    utils           = ep_script_elements_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.doNotAllowEnterAndKeys;

    helperFunctions.createScriptWithSEandSM(function() {
      // open SMs, so any of their lines can be selected
      helper.padInner$('.scene_mark_button--act').click();
      done();
    });

    this.timeout(60000);
  });

  // TODO add more tests. This is VERY incomplete!

  context('when first selected line is a SE', function() {
    before(function(done) {
      var $lines = helper.padInner$('div');
      var $firstGeneral = $lines.first();
      var $lastGeneral = $lines.last();
      helper.selectLines($firstGeneral, $lastGeneral);

      helperFunctions.waitForEtherpadToSyncRep(done);
    });

    context('and user presses ENTER', function() {
      before(function() {
        utils.pressEnter();
      });

      it('does not change anything on the pad', function(done) {
        helperFunctions.checkIfItHasTheOriginalText();
        done();
      });
    });

    context('and user types a char', function() {
      before(function() {
        utils.typeChar();
      });

      it('does not change anything on the pad', function(done) {
        helperFunctions.checkIfItHasTheOriginalText();
        done();
      });
    });
  });

});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.doNotAllowEnterAndKeys = {
  createScriptWithSEandSM: function(done){
    var utils = ep_script_elements_test_helper.utils;
    helper.newPad(function() {
      var scene = utils.act('act')
                + utils.sequence('sequence')
                + utils.synopsis('synopsis')
                + utils.heading('heading');
      var general = utils.general('general');

      var script = general + scene + general;

      utils.createScriptWith(script, 'general', done);
    });
  },

  checkIfItHasTheOriginalText: function() {
    var utils = ep_script_elements_test_helper.utils;

    utils.validateLineTextAndType(0, 'general' , 'general');
    utils.validateLineTextAndType(1, 'act'     , 'act_name');
    utils.validateLineTextAndType(2, 'act'     , 'act_summary');
    utils.validateLineTextAndType(3, 'sequence', 'sequence_name');
    utils.validateLineTextAndType(4, 'sequence', 'sequence_summary');
    utils.validateLineTextAndType(5, 'synopsis', 'scene_name');
    utils.validateLineTextAndType(6, 'synopsis', 'scene_summary');
    utils.validateLineTextAndType(7, 'heading' , 'heading');
    utils.validateLineTextAndType(8, 'general' , 'general');

    var $lines = helper.padInner$('div');
    expect($lines.length).to.be(9);
  },

  waitForEtherpadToSyncRep: function(done) {
    setTimeout(done, 1100);
  }
}
