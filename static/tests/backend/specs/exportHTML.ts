'use strict';

import {init} from "ep_etherpad-lite/tests/backend/common";

import {randomString} from 'ep_etherpad-lite/static/js/pad_utils'
import {generateJWTToken} from "ep_etherpad-lite/tests/backend/common";

let agent;
const apiVersion = 1;

// Creates a pad and returns the pad id. Calls the callback when finished.
const createPad = async (padID, callback) => {
  agent.get(`/api/${apiVersion}/createPad?&padID=${padID}`)
    .set("Authorization", await generateJWTToken())
    .end((err, res) => {
      if (err || (res.body.code !== 0)) callback(new Error('Unable to create new Pad'));
      callback(padID);
    });
};

const setHTML = async (padID, html, callback) => {
  agent.get(`/api/${apiVersion}/setHTML?padID=${padID}&html=${html}`)
    .set("Authorization", await generateJWTToken())
    .end((err, res) => {
      if (err || (res.body.code !== 0)) callback(new Error('Unable to set pad HTML'));
      callback(null, padID);
    });
};

const getHTMLEndPointFor =
    (padID, callback) => `/api/${apiVersion}/getHTML?padID=${padID}`;

const buildHTML = (body) => `<html><body>${body}</body></html>`;

describe('ep_headings2 - export headings to HTML', function () {
  let padID;
  let html;

  before(async function () { agent = await init(); });

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

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Headings HTML tags', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());
      const html = res.body.data.html;
      if (html.indexOf('<h1>Hello world</h1>') === -1) throw new Error('No H1 tag detected');
    });
  });

  context('when pad text has multiple Headings on multiple lines', function () {
    before(async function () {
      html = () => buildHTML('<h1>Hello world</h1><br/><h2>Foo</h2>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Multiple Headings HTML tags', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
      const html = res.body.data.html;
      if (html.indexOf('<h1>Hello world</h1>') === -1) throw new Error('No H1 tag detected');
      if (html.indexOf('<h2>Foo</h2>') === -1) throw new Error('No H2 tag detected');
    });
  });

  context('when pad text has multiple Headings and align tags', function () {
    before(async function () {
      html = () => buildHTML('<h1><left>Hello world</left></h1><br/><h2><center>Foo</center></h2>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Multiple Headings HTML tags', async function () {
      try {
        // eslint-disable-next-line n/no-extraneous-require, n/no-missing-require
        require.resolve('ep_align');
        const res = await agent.get(getHTMLEndPointFor(padID))
          .set("Authorization", await generateJWTToken());
        const html = res.body.data.html;
        console.warn('HTML', html);
        if (html.search(/<h1 +style='text-align:left'>Hello world<\/h1>/) === -1) {
          throw new Error('No H1 tag detected');
        }
        if (html.search(/<h2 +style='text-align:center'>Foo<\/h2>/) === -1) {
          throw new Error('No H2 tag detected');
        }
      } catch (e) {
        if (e.message.indexOf('Cannot find module') === -1) {
          throw new Error(e.message);
        }
      }
    });
  });

  context('when pad has adjacent <h1> and <h2> with no separator', function () {
    // Regression for ether/etherpad#7568 round-trip. Without server-side
    // ccRegisterBlockElements registered for the heading tags,
    // contentcollector treats <h1>/<h2> as inline and adjacent ones
    // merge into a single pad line.
    before(async function () {
      html = () => buildHTML('<h1>Alpha</h1><h2>Beta</h2>');
    });

    it('keeps each heading on its own line', function (done) {
      const expected = /<h1>\s*Alpha\s*<\/h1>[\s\S]*<h2>\s*Beta\s*<\/h2>/;
      generateJWTToken().then((token) => {
        agent.get(getHTMLEndPointFor(padID))
            .set('Authorization', token)
            .end((err, res) => {
              if (err) return done(err);
              const out = res.body.data.html;
              if (out.search(expected) === -1) {
                return done(new Error(
                    `Adjacent headings merged or missing in: ${out}`));
              }
              if (out.search(/AlphaBeta/) !== -1) {
                return done(new Error(
                    `Headings merged into one line: ${out}`));
              }
              done();
            });
      }).catch(done);
    });
  });
});
