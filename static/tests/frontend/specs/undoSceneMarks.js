describe("ep_script_elements - undo scene marks", function(){

  var utils;
  //create a new pad before each test run
  beforeEach(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helper.newPad(function() {
      ep_script_elements_test_helper.undoSceneMarks.createScriptWithSequence(cb);
    });
    this.timeout(60000);
  });

  context("when we have a heading with scene marks", function(){

    context("and changes from heading to other element so then undo the action", function(){

      beforeEach(function(cb){
        var inner$ = helper.padInner$;
        // change from heading to action
        utils.changeToElement(utils.ACTION);
        helper.waitFor(function(){
          // wait for element to be processed and changed
          $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
          return $firstTextElement.find("action").length === 1;
        }).done(cb);
      }, 2000);

      it("displays a heading with scene marks", function(done){
          utils.undo();
          helper.waitFor(function(){
            var inner$ = helper.padInner$;
            $firstTextElement = inner$("div").first();
            var hasHeading = $firstTextElement.find("heading").length === 1;
            var hasSequence = $firstTextElement.find("sequence").length === 1;
            return hasHeading && hasSequence;
          }).done(done);
      });
    })
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.undoSceneMarks = {
  createScriptWithSequence: function(cb) {
    var utils = ep_script_elements_test_helper.utils;

    var script = utils.sequence() +  utils.heading("First Line!");

    utils.createScriptWith(script, "First Line!", cb);
  },
}