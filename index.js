var eejs = require('ep_etherpad-lite/node/eejs/');
var Changeset = require("ep_etherpad-lite/static/js/Changeset");
var Security = require('ep_etherpad-lite/static/js/security');

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
  var script_element = findAttrib(context.attribLine, context.apool, "script_element");
  //try to find a scene line attributes. if it's found mount the HTML with it
  var dataAttributes = mountAdditionalSceneData(context);
  var text = context.lineContent;
  if (script_element) {
    text = text.substring(1);
  } else {
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
  var sceneTag = ["scene-name", "scene-number", "scene-duration", "scene-temporality", "scene-workstate", "scene-index", "scene-time", "scene-summary"];
  var dataAttributes = "";
  for (var i = 0; i < sceneTag.length; i++) {
    var attribute = findAttrib(context.attribLine, context.apool, sceneTag[i]);
    if (attribute !=="") dataAttributes += formatTagOutput(sceneTag[i],attribute);
  };
  if (dataAttributes) dataAttributes = "<scene"+dataAttributes+"></scene>"
  return dataAttributes;
}

//helper to output the sceneTag as tag="value"
function formatTagOutput(key, value) {
  return  " "+key+"=\""+value+"\"";
}