var appUrl = 'http://localhost:9001';
var apiVersion = 1;

var supertest = require('ep_etherpad-lite/node_modules/supertest'),
           fs = require('fs'),
         path = require('path'),
      request = require('ep_etherpad-lite/node_modules/request'),
          api = supertest(appUrl),
 randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

// Loads the APIKEY.txt content into a string, and returns it.
var getApiKey = function() {
  var etherpad_root = '/../../../ep_etherpad-lite/../../..';
  var filePath = path.join(__dirname, etherpad_root + '/APIKEY.txt');
  var apiKey = fs.readFileSync(filePath,  {encoding: 'utf-8'});
  return apiKey.replace(/\n$/, "");
}

var apiKey = getApiKey();

// Functions to validate API responses:
var codeToBe = function(expectedCode, res) {
  if(res.body.code !== expectedCode){
    throw new Error("Code should be " + expectedCode + ", was " + res.body.code);
  }
}


// Creates a pad and returns the pad id. Calls the callback when finished.
var createPad = function(done) {
  var pad = randomString(5);

  api.get('/api/'+apiVersion+'/createPad?apikey='+apiKey+"&padID="+pad)
  .end(function(err, res){
    if(err || (res.body.code !== 0)) done(new Error("Unable to create new Pad"));
  })

  done(null, pad);
}

var readOnlyId = function(padID, callback) {
  api.get('/api/'+apiVersion+'/getReadOnlyID?apikey='+apiKey+"&padID="+padID)
  .end(function(err, res){
    if(err || (res.body.code !== 0)) callback(new Error("Unable to get read only id"));

    callback(null, res.body.data.readOnlyID);
  });
}

/* ********** Available functions/values: ********** */
exports.apiVersion = apiVersion;
exports.api  = api;
exports.appUrl = appUrl;
exports.apiKey = apiKey;
exports.createPad = createPad;
exports.readOnlyId = readOnlyId;
