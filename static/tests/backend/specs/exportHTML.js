const supertest = require('ep_etherpad-lite/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const request = require('ep_etherpad-lite/node_modules/request');
const utils = require('../utils.js');
apiKey = utils.apiKey,
codeToBe0 = utils.codeToBe0,
api = utils.api,
apiVersion = utils.apiVersion,
randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

describe('export headings to HTML', function () {
  let padID;
  let html;

  // create a new pad before each test run
  beforeEach(function (done) {
    padID = randomString(5);

    createPad(padID, () => {
      setHTML(padID, html(), done);
    });
  });

  context('when pad text has one Heading', function () {
    before(function () {
      html = function () {
        return buildHTML('<h1>Hello world</h1>');
      };
    });

    it('returns ok', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect('Content-Type', /json/)
          .expect(200, done);
    });

    it('returns HTML with Headings HTML tags', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const html = res.body.data.html;
            if (html.indexOf('<h1>Hello world</h1>') === -1) throw new Error('No H1 tag detected');
          })
          .end(done);
    });
  });

  context('when pad text has multiple Headings on multiple lines', function () {
    before(function () {
      html = function () {
        return buildHTML('<h1>Hello world</h1><br/><h2>Foo</h2>');
      };
    });

    it('returns ok', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect('Content-Type', /json/)
          .expect(200, done);
    });

    it('returns HTML with Multiple Headings HTML tags', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const html = res.body.data.html;
            if (html.indexOf('<h1>Hello world</h1>') === -1) throw new Error('No H1 tag detected');
            if (html.indexOf('<h2>Foo</h2>') === -1) throw new Error('No H2 tag detected');
          })
          .end(done);
    });
  });
});


// Creates a pad and returns the pad id. Calls the callback when finished.
var createPad = function (padID, callback) {
  api.get(`/api/${apiVersion}/createPad?apikey=${apiKey}&padID=${padID}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to create new Pad'));

        callback(padID);
      });
};

var setHTML = function (padID, html, callback) {
  api.get(`/api/${apiVersion}/setHTML?apikey=${apiKey}&padID=${padID}&html=${html}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to set pad HTML'));

        callback(null, padID);
      });
};

var getHTMLEndPointFor = function (padID, callback) {
  return `/api/${apiVersion}/getHTML?apikey=${apiKey}&padID=${padID}`;
};


var buildHTML = function (body) {
  return `<html><body>${body}</body></html>`;
};
