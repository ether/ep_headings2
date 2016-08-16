describe('ep_script_elements - cut events on multiline selected', function () {

  var utils, SMutils, helperFunctions, event;

  before(function(){
    utils = ep_script_elements_test_helper.utils;
    SMutils = ep_script_scene_marks_test_helper.utils;
    helperFunctions = ep_script_elements_test_helper.cutEvents;
  });

  beforeEach(function(done){
    helper.newPad(function(){
      // create Pad with SM
      helperFunctions.createPadContent(done());
    });
    this.timeout(60000);
  });

  // simulates triple click in a heading
  context('selection begins in a heading and ends in the line break', function(){

    beforeEach(function(done){
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

  });

  context('selection begins and ends in a script element of the same type', function(){

    beforeEach(function(done){

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

    it('joins the elements', function(done){
      utils.validateLineTextAndType(0, 'pohn', 'character');
      utils.validateLineTextAndType(1, 'ACT OF SM text', 'act_name');
      done();
    });

    it('keeps the content on buffer', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var bufferText = $(dataFromGetData).text();
      expect(bufferText).to.be("auldialoguej");
      done();
    });

  });

  context('selection begins in a script element and ends in a scene mark', function(){

    beforeEach(function(done){
      // make the scene marks visible
      var firstHeadingLineNumber = utils.getLineNumberOfElement('heading', 0);
      SMutils.clickOnSceneMarkButtonOfLine(firstHeadingLineNumber);

      var inner$ = helper.padInner$;

      var $firstElement = inner$('div:has(dialogue)').first();
      var $lastElement = inner$('div:has(act_summary)').first();

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

    it('removes the script elements and cleans the scene marks', function(done){
      utils.validateLineTextAndType(0, 'paul', 'character');
      utils.validateLineTextAndType(1, '', 'dialogue');
      utils.validateLineTextAndType(2, '', 'act_name');
      utils.validateLineTextAndType(3, '', 'act_summary');
      done();
    });

    it('pastes the content without SM tags', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var bufferHasNotSMTags = $(dataFromGetData).find("act_name, act_summary, sequence_name, sequence_summary").length === 0;
      var hasReplaceSMBySpan = $(dataFromGetData).find("span").length;

      // 4 spans original + 2 spans that was SM before
      expect(hasReplaceSMBySpan).to.be(6);
      expect(bufferHasNotSMTags).to.be(true);
      done();
    });

  });

  context('selection begins in a SE has SM in the middle and ends in a SE', function(){

    beforeEach(function(done){
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

    it('removes the scripts elements and scene marks', function(done){
      var inner$ = helper.padInner$;
      var scriptLines = inner$("div").length;
      utils.validateLineTextAndType(0, '', 'character');
      expect(scriptLines).to.be(1);
      done();
    });

    it('pastes the content without SM tags', function(done){
      var dataFromGetData = event.originalEvent.clipboardData.getData('text/html');
      var bufferHasNotSMTags = $(dataFromGetData).find("act_name, act_summary, sequence_name, sequence_summary").length === 0;
      var hasReplaceSMBySpan = $(dataFromGetData).find("span").length;

      // 5 spans original + 8 spans that was SM before
      expect(hasReplaceSMBySpan).to.be(13);
      expect(bufferHasNotSMTags).to.be(true);
      done();
    });

  });
});

var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.cutEvents = {
  createPadContent: function(cb){
    var utils = ep_script_elements_test_helper.utils;
    var SMutils = ep_script_scene_marks_test_helper.utils;

    var smText            = 'SM text';
    var lastLineText      = 'last text';

    var character       = utils.character('paul');
    var dialogue        = utils.dialogue('dialogue');
    var secondCharacter = utils.character('john');
    var act             = SMutils.act(smText);
    var sequence        = SMutils.sequence(smText);
    var heading         = utils.heading('heading');
    var action          = utils.action(lastLineText);

    var script = character + dialogue + secondCharacter + act + sequence + heading + action;

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