var eejs = require('ep_etherpad-lite/node/eejs/');
var Changeset = require("ep_etherpad-lite/static/js/Changeset");
var Security = require('ep_etherpad-lite/static/js/security');
var Security = require('ep_etherpad-lite/static/js/security');

var sceneMarkUtils  = require("ep_script_scene_marks/utils");

exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_script_elements/templates/editbarButtons.ejs");
  return cb();
}

// Define the styles so they are consistant between client and server
var style = eejs.require("ep_script_elements/static/css/editor.css")

// Include CSS for HTML export
exports.stylesForExport = function(hook, padId, cb){
  cb(style);
};

// line, apool,attribLine,text
exports.getLineHTMLForExport = function (hook, context) {
  var attribLine = context.attribLine;
  var apool = context.apool;
  var hasSceneMark = sceneMarkUtils.findSceneMarkAttribKey(context);
  if (hasSceneMark){ // if it is a scene mark it is not a script element (including a general)
    return;
  }
  var script_element = null;
  script_element = findAttrib(attribLine, apool, "script_element");

  //try to find a scene line attributes. if it's found it mount the HTML with it
  var dataAttributes = mountAdditionalSceneData(context);
  var text = context.lineContent;
  if (script_element) {
    text = text.substring(1);
  } else { // if it is not a script either a scene mark so it is a general
    script_element = "general";
  }
  //these dataAttributes refers do scene attributes like scene-name, scene-number, ...
  return "<" + script_element + ">" + dataAttributes + text + "</" + script_element + ">";
}

//attrib is the element key in the pair key-value, scene-name:'whatever', in this case scene-name
function findAttrib(alineAttrs, apool, attrib) {
  var script_element = null;
  if (alineAttrs) {
    var opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      var op = opIter.next();
      script_element = Changeset.opAttributeValue(op, attrib, apool);
    }
  }
  return script_element;
}

//check if there's any scene tag as a lineattribute, if so return it formatted
function mountAdditionalSceneData(context) {
  var sceneTag = ["scene-number", "scene-duration", "scene-temporality", "scene-workstate", "scene-index", "scene-time"];
  var dataAttributes = "";
  var sceneDataTags = "";
  for (var i = 0; i < sceneTag.length; i++) {
    var attribute = findAttrib(context.attribLine, context.apool, sceneTag[i]);
    if (attribute){
      dataAttributes += formatTagOutput(sceneTag[i],attribute);
    }
  }
  if (dataAttributes){
    sceneDataTags = "<scene"+dataAttributes+"></scene>";
  }
  return sceneDataTags;
}

//helper to output the sceneTag as tag="value"
function formatTagOutput(key, value) {
  value = Security.escapeHTML(value);
  return  " "+key+"=\""+value+"\"";
}