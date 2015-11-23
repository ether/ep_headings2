describe("ep_script_elements: merge lines", function(){
  var utils;
  //create a new pad before each test run
  beforeEach(function(cb){
    utils = ep_script_elements_test_helper.utils;
    helper.newPad(cb);
    this.timeout(60000);
  });

  context("when element is followed by a different element", function(){

    beforeEach(function(cb) {
      var inner$ = helper.padInner$;
      var $firstTextElement = inner$("div").first();

      // faster way to create two lines (1st is a scene heading, 2nd is an action, 3rd is a parenthetical)
      var firstLine = "<heading>First Line!</heading><br/>";
      var secondLine = "<action>Second Line!</action><br/>";
      var thirdLine = "<parenthetical>Third Line!</parenthetical><br/>";
      $firstTextElement.html(firstLine + secondLine + thirdLine);

      // wait for Etherpad to finish processing lines
      helper.waitFor(function(){
        $ThirdTextElement = inner$("div").first().next().next();
        return $ThirdTextElement.text() === "Third Line!";
      }, 2000).done(cb);
    });

    context("and user presses backspace in the beginning of a line", function(){

      it("does not join these two lines", function(done){
        var inner$ = helper.padInner$;
        utils.placeCaretInTheBeginningOfLine(1, function(){
          utils.pressKey(8);
          setTimeout(function() {
            var textFirstLine = inner$("div").first().text();
            var textSecondLine = inner$("div").first().next().text();
            expect(textFirstLine).to.be("First Line!");
            expect(textSecondLine).to.be("Second Line!");
            done();
          }, 200);
        });
      });
    });

    context("and user presses delete in the end of a line", function(){

      it("does not join these two lines", function(done){
        var inner$ = helper.padInner$;
        utils.placeCaretAtTheEndOfLine(1, function(){
          utils.pressKey(46);
          utils.pressKey(46); // force press delete twice
          setTimeout(function() {
            var textFirstLine = inner$("div").first().text();
            var textSecondLine = inner$("div").first().next().text();
            expect(textFirstLine).to.be("First Line!");
            expect(textSecondLine).to.be("Second Line!");
            done();
          }, 1000);
        });
      });
    });
  });

});
