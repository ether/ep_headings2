var       supertest = require('ep_etherpad-lite/node_modules/supertest'),
              utils = require('../../../utils'),
          createPad = utils.createPad,
          setHTML   = utils.setHTML,
          getHTML   = utils.getHTML,
         apiVersion = 1;
       randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

describe('read scenes data', function(){
  var padID, html, expected;
  expected = "<!DOCTYPE HTML><html><body> <general></general></body></html>";
  //create a new pad before each test run
  beforeEach(function(done){
    padID = randomString(5);

    createPad(padID, function() {
      setHTML(padID, html(), done);
    });
  })

  context('when pad has no scene', function(){

    before(function() {
      html = function() {
        return buildHTML("");
      }
    });

    it('gets html without a heading', function(done) {
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    })
  });

  context('when pad has one scene', function(){

    before(function() {
      html = function() {
        return buildHTML("<heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate></scene>Once upon a time</heading>");
      }
    });

    it('gets html processed when exported', function(done) {
      expected = buildExpectedHTML("<heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading>");
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    });

    context('and scene has workstate and number as attributes', function(){

      before(function() {
        html = function() {
          return buildHTML("<heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate><scene-number class=\"1\"><empty/></scene-number></scene>Once upon a time</heading>");
        }
      });

      it('gets html processed when exported', function(done) {
        expected = buildExpectedHTML("<heading><scene scene-number=\"1\" scene-workstate=\"whatever\"></scene>Once upon a time</heading>");
        getHTML(padID, function(err, html_res){
          if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
          done();
        });
      });
    });

    context('and scene has name and a invalid attribute as attribute', function(){

      before(function() {
        html = function() {
          return buildHTML("<heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate><scene-invalid class=\"1\"><empty/></scene-invalid></scene>Once upon a time</heading>");
        }
      });

      it('exports only name attribute', function(done) {
        expected = buildExpectedHTML("<heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading>");
        getHTML(padID, function(err, html_res){
          if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
          done();
        });
      });
    });
    context('and scene has number, duration, temporality, workstate and time as attributes', function(){

      before(function() {
        html = function() {
          return buildHTML("<heading><scene>" +
            "<scene-number class=\"11\"><empty/></scene-number>" +
            "<scene-duration class=\"30\"><empty/></scene-duration>" +
            "<scene-temporality class=\"PRESENT\"><empty/></scene-temporality>" +
            "<scene-workstate class=\"IMMATURE\"><empty/></scene-workstate>" +
            "<scene-time class=\"20\"><empty/></scene-time>" +
            "Once upon a time</heading>");
        }
      });

      it('gets html processed when exported', function(done) {
        expected = buildExpectedHTML("<heading><scene scene-number=\"11\" scene-duration=\"30\" scene-temporality=\"PRESENT\" scene-workstate=\"IMMATURE\" scene-time=\"20\"></scene>Once upon a time</heading>");
        getHTML(padID, function(err, html_res){
          if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
          done();
        });
      });
    });
  });

  context('when pad has two scenes', function(){

    before(function() {
      html = function() {
        return buildHTML("<heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate></scene>Once upon a time</heading><br><heading><scene><scene-workstate class=\"end\"><empty/></scene-workstate></scene>The End</heading>");
      }
    });

    it('gets two headings when exported', function(done) {
      expected = buildExpectedHTML("<heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading> <heading><scene scene-workstate=\"end\"></scene>The End</heading>");
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    });
  });

  context('when pad has two scenes first one without scene-workstate', function(){

    before(function() {
      html = function() {
        return buildHTML("<heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate></scene>Once upon a time</heading><br><heading>The End</heading>");
      }
    });

    it('gets two headings when exported', function(done) {
      expected = buildExpectedHTML("<heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading> <heading>The End</heading>");
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    });
  });

  context('when pad has one scene and one action', function(){

    before(function() {
      html = function() {
        return buildHTML("<heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate></scene>Once upon a time</heading><br><action>The End</action>");
      }
    });

    it('gets a heading with attributes and one action', function(done) {
      expected = buildExpectedHTML("<heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading> <action>The End</action>");
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    });
  });

  context('when pad has one action and one scene', function(){

    before(function() {
      html = function() {
        return buildHTML("<action>The End</action><br><heading><scene><scene-workstate class=\"whatever\"><empty/></scene-workstate></scene>Once upon a time</heading>");
      }
    });

    it('gets an action and a heading with attributes', function(done) {
      expected = buildExpectedHTML("<action>The End</action> <heading><scene scene-workstate=\"whatever\"></scene>Once upon a time</heading>");
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    });
  });

  context('when scene tag has special chars', function(){
    before(function() {
      html = function() {
        return buildHTML("<action>The End</action><br><heading><scene><scene-workstate class=\"=>'arrow'<=\"><empty\></scene-workstate></scene>Once upon a time</heading>");
      }
    });

    it('gets scene-workstate escaped', function(done) {
      expected = buildExpectedHTML("<action>The End</action> <heading><scene scene-workstate=\"=&gt;&#x27;arrow&#x27;&lt;=\"></scene>Once upon a time</heading>");
      getHTML(padID, function(err, html_res){
        if(expected !== html_res ) throw new Error("Exported HTML doesn't match to expected HTML - Expected " + expected + " got " + html_res);
        done();
      });
    });
  });

});

var buildExpectedHTML = function(html){

  return "<!DOCTYPE HTML><html><body> "+html+" <general></general></body></html>";
}

var buildHTML = function(html){
  return "<html><body>"+html+"</body></html>";
}
