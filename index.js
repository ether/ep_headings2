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
  var script_element = _analyzeLine(context.attribLine, context.apool);
  var text = context.lineContent;
  if (script_element) {
    text = text.substring(1);
  } else {
    script_element = "general"
  }
  return "<" + script_element + ">" + text + "</" + script_element + ">";
}

function _analyzeLine(alineAttrs, apool) {
  var script_element = null;
  if (alineAttrs) {
    var opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      var op = opIter.next();
      script_element = Changeset.opAttributeValue(op, 'script_element', apool);
    }
  }
  return script_element;
}
