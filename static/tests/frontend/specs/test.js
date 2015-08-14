describe("Script Element", function(){

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
});

