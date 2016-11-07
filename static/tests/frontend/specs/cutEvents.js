describe('ep_script_elements - cut events on multiline selected', function () {

  var utils, SMutils, helperFunctions, event;

  before(function(done){
    utils = ep_script_elements_test_helper.utils;
    SMutils = ep_script_scene_marks_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.cutEvents;
    helper.newPad(function(){
      // create Pad with SM
      helperFunctions.createPadContent(done);
    });
    this.timeout(60000);
  });


  // simulates triple click in a heading
  context('selection begins in a heading and ends in the line break', function(){

    before(function(done){
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 0);
      SMutils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(heading)').first();
      var $lastElement = inner$('div:has(action)').first();

      var offsetAtFirstElement = 0;
      var offsetAtlastElement = 0;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // trigger cut
      setTimeout(function() {
        event = helperFunctions.triggerCut();
        done();
      }, 1000);
    });

    after(function(){
      utils.undo();
    })

    it('cleans the SM', function(done){
      utils.validateLineTextAndType(0, 'paul', 'character');
      utils.validateLineTextAndType(1, 'dialogue', 'dialogue');
      utils.validateLineTextAndType(2, 'john', 'character');
      utils.validateLineTextAndType(3, 'last text', 'action');
      done();
    });

    it('keeps the content on buffer', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var hasAHeading = $(dataFromGetData).find("heading").length !== 0;
      var bufferText = $(dataFromGetData).text();
      expect(bufferText).to.be("heading");
      expect(hasAHeading).to.be(true);
      done();
    });

    it('has the plain text in buffer', function(done){
      var plainText = event.originalEvent.clipboardData.getData('text/plain');
      expect(plainText).to.be("heading\n");
      done();
    });

  });

  context('selection begins and ends in a script element of the same type', function(){

    before(function(done){

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(character)').first();
      var $lastElement = inner$('div:has(character)').last();

      var offsetAtFirstElement = 1;
      var offsetAtlastElement = 1;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // trigger cut
      setTimeout(function() {
        event = helperFunctions.triggerCut();
        done();
      }, 1000);
    });

    after(function () {
      utils.undo();
    });

    it('joins the elements', function(done){
      utils.validateLineTextAndType(0, 'pohn', 'character');
      utils.validateLineTextAndType(1, 'SM text', 'act_name');
      done();
    });

    it('keeps the content on buffer', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var bufferText = $(dataFromGetData).text();
      expect(bufferText).to.be("auldialoguej");
      done();
    });

    it('has the plain text in buffer', function(done){
      var plainText = event.originalEvent.clipboardData.getData('text/plain');
      expect(plainText).to.be("aul\ndialogue\nj");
      done();
    });

  });

  context('selection begins in a script element and ends in a scene mark', function(){

    before(function(done){
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 0);
      SMutils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(dialogue)').first();
      var $lastElement = inner$('div:has(scene_summary)').first();

      var lastLineLength = $lastElement.text().length;
      var offsetAtFirstElement = 0;
      var offsetAtlastElement = lastLineLength;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // trigger cut
      setTimeout(function() {
        event = helperFunctions.triggerCut();
        done();
      }, 1000);
    });

    after(function () {
      utils.undo();
    });

    it('removes the script elements and cleans the scene marks', function(done){
      utils.validateLineTextAndType(0, 'paul', 'character');
      utils.validateLineTextAndType(1, '', 'dialogue');
      utils.validateLineTextAndType(2, '', 'act_name');
      utils.validateLineTextAndType(3, '', 'act_summary');
      utils.validateLineTextAndType(4, '', 'sequence_name');
      utils.validateLineTextAndType(5, '', 'sequence_summary');
      utils.validateLineTextAndType(6, '', 'scene_name');
      utils.validateLineTextAndType(7, '', 'scene_summary');
      done();
    });

    it('pastes the content without SM tags', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var bufferHasNotSMTags = $(dataFromGetData).find(SMutils.SCENE_MARKS_TAGS).length === 0;
      var hasReplaceSMBySpan = $(dataFromGetData).find("span").length;

      // 8 spans original + 6 spans that was SM before
      expect(hasReplaceSMBySpan).to.be(14);
      expect(bufferHasNotSMTags).to.be(true);
      done();
    });

    it('has the plain text in buffer', function(done){
      var plainText = event.originalEvent.clipboardData.getData('text/plain');
      var resultText = "dialogue\njohn\nSM text\nSM text\nSM text\nSM text\nSM text\nSM text";
      expect(plainText).to.be(resultText);
      done();
    });

  });

  context('selection begins in a SE has SM in the middle and ends in a SE', function(){

    before(function(done){
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 0);
      SMutils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(character)').first();
      var $lastElement = inner$('div:has(action)').first();

      var lastLineLength = $lastElement.text().length;
      var offsetAtFirstElement = 0;
      var offsetAtlastElement = lastLineLength;

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // trigger cut
      setTimeout(function() {
        event = helperFunctions.triggerCut();
        done();
      }, 1000);
    });

    after(function () {
      utils.undo();
    });

    it('removes the scripts elements and scene marks', function(done){
      var inner$ = helper.padInner$;
      var scriptLines = inner$("div").length;
      utils.validateLineTextAndType(0, '', 'character');
      expect(scriptLines).to.be(1);
      done();
    });

    it('pastes the content without SM tags', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var bufferHasNotSMTags = $(dataFromGetData).find(SMutils.SCENE_MARKS_TAGS).length === 0;
      var hasReplaceSMBySpan = $(dataFromGetData).find("span").length;

      // 5 spans original + 12 spans that was SM before
      expect(hasReplaceSMBySpan).to.be(17);
      expect(bufferHasNotSMTags).to.be(true);
      done();
    });

    it('has the plain text in buffer', function(done){
      var plainText = event.originalEvent.clipboardData.getData('text/plain');
      var resultText = "paul\ndialogue\njohn\nSM text\nSM text\n" +
                       "SM text\nSM text\nSM text\nSM text\nheading\nlast text"
      expect(plainText).to.be(resultText);
      done();
    });
  });

  context('selection begins in a SE and goes until part of a heading', function () {
    before(function(done){
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 0);
      SMutils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(character)').first();
      var $lastElement = inner$('div:has(heading)').first();

      var offsetAtFirstElement = 2; // select from PA
      var offsetAtlastElement = 2; // select until HE

      // make the selection
      helper.selectLines($firstElement, $lastElement, offsetAtFirstElement, offsetAtlastElement);

      // trigger cut
      setTimeout(function() {
        event = helperFunctions.triggerCut();
        done();
      }, 1000);
    });

    after(function () {
      // utils.undo();
    });

    it('removes the script elements and cleans the scene marks', function(done){
      utils.validateLineTextAndType(0, 'pa', 'character');
      utils.validateLineTextAndType(1, '', 'act_name');
      utils.validateLineTextAndType(2, '', 'act_summary');
      utils.validateLineTextAndType(3, '', 'sequence_name');
      utils.validateLineTextAndType(4, '', 'sequence_summary');
      utils.validateLineTextAndType(5, '', 'scene_name');
      utils.validateLineTextAndType(6, '', 'scene_summary');
      utils.validateLineTextAndType(7, 'ading', 'heading');
      done();
    });
  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.cutEvents = {
  createPadContent: function(cb){
    var utils = ep_script_elements_test_helper.utils;

    var smText            = 'SM text';
    var lastLineText      = 'last text';

    var character       = utils.character('paul');
    var dialogue        = utils.dialogue('dialogue');
    var secondCharacter = utils.character('john');
    var act             = utils.act(smText);
    var sequence        = utils.sequence(smText);
    var synopsis        = utils.synopsis(smText);
    var heading         = utils.heading('heading');
    var action          = utils.action(lastLineText);

    var script = character + dialogue + secondCharacter + act + sequence + synopsis + heading + action;

    utils.createScriptWith(script, lastLineText, cb)
  },
  clickOnSceneMarkButtonOfLine: function(lineNumber){
    var utils = ep_script_scene_marks_test_helper.utils;
    utils.clickOnSceneMarkButtonOfLine(lineNumber);
  },
  //cut events
  /**** function related to paste event ****/
  elementToBePasted: function(line, interval){
    var inner$ = helper.padInner$;
    var lines$ = inner$('div');
    var $elementsToBePasted = lines$.slice(line, line + interval);
    return $elementsToBePasted;
  },
  triggerCut: function(){
     var chrome$ = helper.padChrome$;
     var inner$ = helper.padInner$;

     // store data into a simple object, indexed by format
     var clipboardDataMock = {
      data: {},
      setData: function(format, value) {
        this.data[format] = value;
      },
      getData: function(format) {
        return this.data[format];
      }
     };

     var event = jQuery.Event('cut');
     var e = {clipboardData: clipboardDataMock};
     event.originalEvent = e;

     // Hack: we need to use the same jQuery instance that is registering the main window,
     // so we use 'chrome$(inner$('div')[0])' instead of simply 'inner$('div)'
     chrome$(inner$('div')[0]).trigger(event);
     return event;
   },
  getLine: function(lineNum) {
    var inner$ = helper.padInner$;
    var line = inner$('div').first();
    for (var i = lineNum - 1; i >= 0; i--) {
      line = line.next();
    }
    return line;
  },
}