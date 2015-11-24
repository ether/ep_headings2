var BACKSPACE = 8;
var DELETE = 46;

describe("ep_script_elements - merge lines", function(){
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
          utils.pressKey(BACKSPACE);
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
          utils.pressKey(DELETE);
          utils.pressKey(DELETE);
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

    context("and element line is empty", function(){

      beforeEach(function (cb) {
        var $secondLine = utils.getLine(1).find("action");
        // the space after the select all ensures empty lines are lines without any text but with spaces
        // which is technically empty
        $secondLine.sendkeys("{selectall}{backspace} ");
        helper.waitFor(function(){
          var inner$ = helper.padInner$;
          var $secondLine = inner$("div").first().next();
          // only one space in the line
          return $secondLine.text().length === 1;
        }).done(cb);
      });

      context("and user presses backspace in the beginning of this line", function(){

        it("erases the empty line", function(done){
          var inner$ = helper.padInner$;
          utils.placeCaretInTheBeginningOfLine(1, function(){
            utils.pressKey(BACKSPACE); // backspace
          });
          helper.waitFor(function(){
            var $secondLine = inner$("div").first().next();
            return $secondLine.text() === "Third Line!";
          }).done(done);
        });

      });
      // this test is commented because delete key does not work in the test
      // as soon as we find the solution this should be uncommented =)

      // context("and user presses delete at the end of the previous line", function(){
      //   it("erases the empty line", function(done){
      //     var inner$ = helper.padInner$;
      //     utils.placeCaretAtTheEndOfLine(0, function(){
      //       utils.pressKey(DELETE); // delete
      //     });
      //     helper.waitFor(function(){
      //       // as the second line was empty, delete removed it so the third line is now the second one
      //       var $secondLine = inner$("div").first().next();
      //       return $secondLine.text() === "Third Line!";
      //     }).done(done);
      //   });
      // });

    });

  });

});
