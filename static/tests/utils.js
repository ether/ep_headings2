var appUrl = 'http://localhost:9001';
var apiVersion = 1;

var supertest = require('ep_etherpad-lite/node_modules/supertest'),
           fs = require('fs'),
         path = require('path'),
      //      io = require('socket.io-client'),
      request = require('request'),
          api = supertest(appUrl),
 randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

// Loads the APIKEY.txt content into a string, and returns it.
var getApiKey = function() {
  var etherpad_root = '/../../../ep_etherpad-lite/../..';
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

var codeToBe0 = function(res) { codeToBe(0, res) }
var codeToBe1 = function(res) { codeToBe(1, res) }
var codeToBe4 = function(res) { codeToBe(4, res) }

// App end point to create a scene via API
var scenesEndPointFor = function(pad) {
  return '/p/'+pad+'/scenes';
}

// // App end point to create a comment reply via API
// var commentRepliesEndPointFor = function(pad) {
//   return '/p/'+pad+'/commentReplies';
// }

// Creates a pad and returns the pad id. Calls the callback when finished.
var createPad = function(padID, callback) {
  api.get('/api/'+apiVersion+'/createPad?apikey='+apiKey+"&padID="+padID)
  .end(function(err, res){
    if(err || (res.body.code !== 0)) callback(new Error("Unable to create new Pad"));

    callback(padID);
  })
}

//Set the html text of a given pad
var setHTML = function(padID, html, callback) {
  api.get('/api/'+apiVersion+'/setHTML?apikey='+apiKey+"&padID="+padID+"&html="+html)
  .end(function(err, res){
    if(err || (res.body.code !== 0)) callback(new Error("Unable to set pad HTML"));

    callback(null, padID);
  })
}

//Get the html text of a given pad
var getHTML = function(padID, callback) {
  api.get('/api/'+apiVersion+'/getHTML?apikey='+apiKey+"&padID="+padID)
  .end(function(err, res){
    if(err || (res.body.code !== 0)) callback(new Error("Unable to get pad HTML"));
    callback(null, res.body.data.html);
  })
}

exports.apiVersion = apiVersion;
exports.api  = api;
exports.appUrl = appUrl;
exports.apiKey = apiKey;
exports.createPad = createPad;
exports.setHTML   = setHTML;
exports.getHTML   = getHTML;
// exports.createComment = createComment;
// exports.createCommentReply = createCommentReply;
exports.codeToBe0 = codeToBe0;
exports.codeToBe1 = codeToBe1;
exports.codeToBe4 = codeToBe4;
exports.scenesEndPointFor = scenesEndPointFor;
// exports.commentRepliesEndPointFor = commentRepliesEndPointFor;
