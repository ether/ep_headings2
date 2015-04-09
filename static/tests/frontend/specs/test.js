describe("Set Script Element and ensure its removed properly", function(){

  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
    this.timeout(60000);
  });

  // Create Pad
  // Check Default Text has no Script Element
  // Set Line 1 script element and check it's set
  // Set Line 2 to null script element value and check it's set

  it("Option select is changed when script element is changed", function(done) {
    this.timeout(60000);
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    var $editorContainer = chrome$("#editorcontainer");

    var $editorContents = inner$("div")
    $editorContents.sendkeys('{selectall}');
    $firstTextElement.sendkeys('First Line!');

    // sets first line to heading
    chrome$('#script_element-selection').val('0');
    chrome$('#script_element-selection').change();

    $firstTextElement.sendkeys('{enter}');

    var $headingElement = inner$("div").first();

    helper.waitFor(function(){
      return chrome$('#script_element-selection').val() == 0;
    }).done(function(){
      var $firstTextElement = inner$("div").first();
      $firstTextElement.sendkeys('{selectall}');
      var $secondElement = inner$("div").first().next();
      $secondElement.sendkeys('Second Line');
      $secondElement.sendkeys('{selectall}');
      helper.waitFor(function(){
        return chrome$('#script_element-selection').val() == -1;
      }).done(function(){
        expect($secondElement.find("heading").length).to.be(0);
        expect($secondElement.text()).to.be("Second Line");
        done();
      });

    });

  });



});

