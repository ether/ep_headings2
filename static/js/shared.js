var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot'];
var sceneTag = ["scene-number", "scene-duration", "scene-temporality", "scene-workstate", "scene-time"];

var collectContentPre = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes

  if(tname === "div" || tname === "p"){
    delete lineAttributes['script_element'];
  }

  if (isScriptElement(tname)) {
    lineAttributes['script_element'] = tname;
  } else if (isSceneTag(tname)) {
    // scene tag value is stored on element class
    lineAttributes[tname] = context.cls;
  }
};

// I don't even know when this is run..
var collectContentPost = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = _.indexOf(tags, tname);
  if(tagIndex >= 0){
    //take line-attributes used away - script_element and scenesData[]
    //all elements in the tags array uses script_element as key of lineattributes
    var usedLineAttributes = _.union(sceneTag, ['script_element'])
    for (var i = 0; i < usedLineAttributes.length ; i++) {
      delete lineAttributes[usedLineAttributes[i]];
    }
  }
};

var isSceneTag = function(tname) {
  return _.indexOf(sceneTag, tname) >= 0;
}
var isScriptElement = function(tname) {
  return _.indexOf(tags, tname) >= 0;
}

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
exports.tags = tags;
exports.sceneTag = sceneTag;
