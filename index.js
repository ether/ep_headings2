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
  if (script_element) {
    return "<" + script_element + ">" + Security.escapeHTML(context.text.substring(1)) + "</" + script_element + ">";
  } else {
    return "<general>" + Security.escapeHTML(context.text) + "</general>";
  }
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
