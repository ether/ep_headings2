const appUrl = 'http://localhost:9001';
const apiVersion = 1;

const supertest = require('ep_etherpad-lite/node_modules/supertest');
const api = supertest(appUrl);
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

const apiKey = require('ep_etherpad-lite/node/handler/APIHandler.js').exportedForTestingOnly.apiKey;

// Functions to validate API responses:
const codeToBe = function (expectedCode, res) {
  if (res.body.code !== expectedCode) {
    throw new Error(`Code should be ${expectedCode}, was ${res.body.code}`);
  }
};


// Creates a pad and returns the pad id. Calls the callback when finished.
const createPad = function (done) {
  const pad = randomString(5);

  api.get(`/api/${apiVersion}/createPad?apikey=${apiKey}&padID=${pad}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) done(new Error('Unable to create new Pad'));
      });

  done(null, pad);
};

const readOnlyId = function (padID, callback) {
  api.get(`/api/${apiVersion}/getReadOnlyID?apikey=${apiKey}&padID=${padID}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to get read only id'));

        callback(null, res.body.data.readOnlyID);
      });
};

/* ********** Available functions/values: ********** */
exports.apiVersion = apiVersion;
exports.api = api;
exports.appUrl = appUrl;
exports.apiKey = apiKey;
exports.createPad = createPad;
exports.readOnlyId = readOnlyId;
