var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'general'];

var collectContentPre = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tname === "div" || tname === "p"){
    delete lineAttributes['script_element'];
  }
  if(tagIndex >= 0){
    lineAttributes['script_element'] = tags[tagIndex];
  }
};

// I don't even know when this is run..
var collectContentPost = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tagIndex >= 0){
    delete lineAttributes['script_element'];
  }
};

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
