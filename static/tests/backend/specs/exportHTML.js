'use strict';

const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
const utils = require('../utils.js');

const {api, apiKey, apiVersion} = utils;

// Creates a pad and returns the pad id. Calls the callback when finished.
const createPad = (padID, callback) => {
  api.get(`/api/${apiVersion}/createPad?apikey=${apiKey}&padID=${padID}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to create new Pad'));
        callback(padID);
      });
};

const setHTML = (padID, html, callback) => {
  api.get(`/api/${apiVersion}/setHTML?apikey=${apiKey}&padID=${padID}&html=${html}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to set pad HTML'));
        callback(null, padID);
      });
};

const getHTMLEndPointFor =
    (padID, callback) => `/api/${apiVersion}/getHTML?apikey=${apiKey}&padID=${padID}`;

const buildHTML = (body) => `<html><body>${body}</body></html>`;

describe('ep_headings2 - export headings to HTML', function () {
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
    before(async function () {
      html = () => buildHTML('<h1>Hello world</h1>');
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
    before(async function () {
      html = () => buildHTML('<h1>Hello world</h1><br/><h2>Foo</h2>');
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

  context('when pad text has multiple Headings and align tags', function () {
    before(async function () {
      html = () => buildHTML('<h1><left>Hello world</left></h1><br/><h2><center>Foo</center></h2>');
    });

    it('returns ok', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect('Content-Type', /json/)
          .expect(200, done);
    });

    it('returns HTML with Multiple Headings HTML tags', function (done) {
      try {
        require.resolve('ep_align'); // eslint-disable-line
        api.get(getHTMLEndPointFor(padID))
            .expect((res) => {
              const html = res.body.data.html;
              if (html.indexOf('<h1 style="text-align:left">Hello world</h1>') === -1) {
                throw new Error('No H1 tag detected');
              }
              if (html.indexOf('<h2 style="text-align:center">Foo</h2>') === -1) {
                throw new Error('No H2 tag detected');
              }
            })
            .end(done);
      } catch (e) {
        if (e.message.indexOf('Cannot find module') === -1) {
          throw new Error(e.message);
        }
        done();
      }
    });
  });
});
