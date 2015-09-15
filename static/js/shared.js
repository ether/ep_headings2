var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'];
var sceneDatas = ["scene-name", "scene-number", "scene-duration", "scene-temporality", "scene-workstate"];

var collectContentPre = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  //check if tname is a valid scene attribute
  var sceneDatasIndex =  _.indexOf(sceneDatas, tname);
  var tagIndex = _.indexOf(tags, tname);

  if(tname === "div" || tname === "p"){
    delete lineAttributes['script_element'];
  }
  if(tagIndex >= 0){
    lineAttributes['script_element'] = tags[tagIndex];
  }
  //take the scene tag its class, which is its value, and uses as lineAttributes key-value
  else if(sceneDatasIndex>=0){
    lineAttributes[sceneDatas[sceneDatasIndex]] = context.cls;
  }
};

// I don't even know when this is run..
var collectContentPost = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tagIndex >= 0){
    //take lineattributes used away - script_element and scenesDatas[]
    //all elements in the tags array uses script_element as key of lineattributes
    var usedLineAttributes = _.union(sceneDatas, ['script_element'])
    for (var i = 0; i < usedLineAttributes.length ; i++) {
      delete lineAttributes[usedLineAttributes[i]];
    };

  }
};

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
exports.tags = tags;
