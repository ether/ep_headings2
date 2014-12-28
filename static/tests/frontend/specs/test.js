describe("Set Heading and ensure its removed properly", function(){

  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
    this.timeout(60000);
  });

  // Create Pad
   // Check Default Text has no Heading
    // Set Line 1 heading and check it's set
     // Set Line 1 back to null heading value and check it's set
      // Do the same for all other line style types

  it("Checks default content doesn't have H1", function(done) {
    this.timeout(60000);
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    var $editorContainer = chrome$("#editorcontainer");

    var hasH1 = $firstTextElement.find("h1").length !== 0;
    helper.waitFor(function(){
      return !hasH1;
    }).done(function(){
      expect(hasH1).to.be(false);
      done();
    });
  });

  it("Checks we can set content to H1 and reset it", function(done) {
    this.timeout(60000);
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    var $editorContainer = chrome$("#editorcontainer");

    $firstTextElement.sendkeys('{selectall}');

    // sets first line to h1
    chrome$('#heading-selection').val('0');
    chrome$('#heading-selection').change();

    var $h1Element = inner$("div").first();

    helper.waitFor(function(){
      return $h1Element.find("h1").length === 1;
    }).done(function(){
      var $h1Element = inner$("div").first();

      expect($h1Element.find("h1").length).to.be(1);

      $firstTextElement.sendkeys('{selectall}');

      // sets first line heading back to normal text
      chrome$('#heading-selection').val('-1');
      chrome$('#heading-selection').change();

      var $h1Element = inner$("div").first();
      helper.waitFor(function(){
        return $h1Element.find("h1").length === 0
      }).done(function(){
        expect($h1Element.find("h1").length).to.be(0);
        done();
      });

    });

  });

  it("Checks we can set content to H1 then on 'enter key' ensure h1 is lost", function(done) {
    this.timeout(60000);
    var chrome$ = helper.padChrome$;
    var inner$ = helper.padInner$;

    var $firstTextElement = inner$("div").first();
    var $editorContainer = chrome$("#editorcontainer");

    var $editorContents = inner$("div")
    $editorContents.sendkeys('{selectall}');
    $firstTextElement.sendkeys('First Line!');

    // sets first line to h1
    chrome$('#heading-selection').val('0');
    chrome$('#heading-selection').change();

    $firstTextElement.sendkeys('{enter}');

    var $h1Element = inner$("div").first();

    helper.waitFor(function(){
      return $h1Element.find("h1").length === 1;
    }).done(function(){
      var $firstTextElement = inner$("div").first();
      $firstTextElement.sendkeys('{enter}');
      var $secondElement = inner$("div").first().next();
      $secondElement.sendkeys('Second Line should not have H1');
      helper.waitFor(function(){
        return $secondElement.find("h1").length === 0
      }).done(function(){
        expect($secondElement.find("h1").length).to.be(0);
        expect($secondElement.text()).to.be("Second Line should not have H1");
        done();
      });

    });

  });

});

