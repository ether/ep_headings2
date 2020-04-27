var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['h1', 'h2', 'h3', 'h4', 'code'];

var collectContentPre = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tname === "div" || tname === "p"){
    delete lineAttributes['heading'];
  }
  if(tagIndex >= 0){
    lineAttributes['heading'] = tags[tagIndex];
  }
};

// I don't even know when this is run..
var collectContentPost = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tagIndex >= 0){
    delete lineAttributes['heading'];
  }
};

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
