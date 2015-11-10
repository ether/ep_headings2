describe("ep_script_elements", function(){

  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
    this.timeout(60000);
  });

  it("Option select is changed when script element is changed", function(done) {
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    chrome$('#script_element-selection').val('0');
    chrome$('#script_element-selection').change();

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("heading").length === 1;
    }).done(done);
  });

  it("Style is cleared when General is selected", function(done) {
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    chrome$('#script_element-selection').val('0');
    chrome$('#script_element-selection').change();

    helper.waitFor(function(){
      // wait for element to be processed and changed
      $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
      return $firstTextElement.find("heading").length === 1;
    }).done(function(){
      // sets first line to general
      chrome$('#script_element-selection').val('-1');
      chrome$('#script_element-selection').change();

      helper.waitFor(function(){
        // wait for element to be processed and changed
        $firstTextElement = inner$("div").first(); // need to get it again because line is changed by Content Collector
        return $firstTextElement.find("heading").length === 0;
      }).done(done);
    });
  });

  context("when pad has lines with different element types", function() {
    beforeEach(function(cb) {
      var inner$ = helper.padInner$;
      var $firstTextElement = inner$("div").first();

      // faster way to create two lines (1st is a scene heading, 2nd is an action)
      var firstLine = "<heading>First Line!</heading><br/>";
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

      // places caret on heading
      var $heading = inner$("div").first();
      $heading.sendkeys("{selectall}");

      // validate select shows "Heading"
      helper.waitFor(function() {
        var selectedValue = chrome$('#script_element-selection option:selected').text();
        return selectedValue === "Heading";
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

      // places caret on heading to force select value to not be "Action"
      var $heading = inner$("div").first();
      $heading.sendkeys("{selectall}");

      helper.waitFor(function() {
        var selectedValue = chrome$('#script_element-selection option:selected').text();
        return selectedValue === "Heading";
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
});

