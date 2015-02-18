var eejs = require('ep_etherpad-lite/node/eejs/');
var Changeset = require("ep_etherpad-lite/static/js/Changeset");
var Security = require('ep_etherpad-lite/static/js/security');

exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_headings2/templates/editbarButtons.ejs");
  return cb();
}

// Define the styles so they are consistant between client and server
var style = "h1{font-size: 2.0em;line-height: 120%;} \
  h2{font-size: 1.5em;line-height: 120%;} \
  h3{font-size: 1.17em;line-height: 120%;} \
  h4{line-height: 120%;} \
  h5{font-size: 0.83em;line-height: 120%;} \
  h6{font-size: 0.75em;line-height: 120%;} \
  code{font-family: monospace;}";

// Include CSS for HTML export
exports.stylesForExport = function(hook, padId, cb){
  cb(style);
};

// line, apool,attribLine,text
exports.getLineHTMLForExport = function (hook, context) {
  var header = _analyzeLine(context.attribLine, context.apool);
  if (header) {
    return "<" + header + ">" + Security.escapeHTML(context.text.substring(1)) + "</" + header + ">";
  }
}

function _analyzeLine(alineAttrs, apool) {
  var header = null;
  if (alineAttrs) {
    var opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      var op = opIter.next();
      header = Changeset.opAttributeValue(op, 'heading', apool);
    }
  }
  return header;
}
