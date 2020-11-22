var _, $, jQuery;

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var headingClass = 'heading';
var cssFiles = ['ep_headings2/static/css/editor.css'];

// All our tags are block elements, so we just return them.
var tags = ['h1', 'h2', 'h3', 'h4', 'code'];
exports.aceRegisterBlockElements = function () {
  return tags;
};

// Bind the event handler to the toolbar buttons
exports.postAceInit = function (hook, context) {
  const hs = $('#heading-selection');
  hs.on('change', function () {
    const value = $(this).val();
    const intValue = parseInt(value, 10);
    if (!_.isNaN(intValue)) {
      context.ace.callWithAce((ace) => {
        ace.ace_doInsertHeading(intValue);
      }, 'insertheading', true);
      hs.val('dummy');
    }
  });
};

// On caret position change show the current heading
exports.aceEditEvent = function (hook, call, cb) {
  // If it's not a click or a key event and the text hasn't changed then do nothing
  const cs = call.callstack;
  if (!(cs.type == 'handleClick') && !(cs.type == 'handleKeyEvent') && !(cs.docTextChanged)) {
    return false;
  }
  // If it's an initial setup event then do nothing..
  if (cs.type == 'setBaseText' || cs.type == 'setup') return false;

  // It looks like we should check to see if this section has this attribute
  setTimeout(() => { // avoid race condition..
    const attributeManager = call.documentAttributeManager;
    const rep = call.rep;
    let firstLine, lastLine;
    const activeAttributes = {};
    $('#heading-selection').val('dummy').niceSelect('update');

    firstLine = rep.selStart[0];
    lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
    let totalNumberOfLines = 0;

    _(_.range(firstLine, lastLine + 1)).each((line) => {
      totalNumberOfLines++;
      const attr = attributeManager.getAttributeOnLine(line, 'heading');
      if (!activeAttributes[attr]) {
        activeAttributes[attr] = {};
        activeAttributes[attr].count = 1;
      } else {
        activeAttributes[attr].count++;
      }
    });

    $.each(activeAttributes, (k, attr) => {
      if (attr.count === totalNumberOfLines) {
        // show as active class
        const ind = tags.indexOf(k);
        $('#heading-selection').val(ind).niceSelect('update');
      }
    });
  }, 250);
};

// Our heading attribute will result in a heaading:h1... :h6 class
exports.aceAttribsToClasses = function (hook, context) {
  if (context.key == 'heading') {
    return [`heading:${context.value}`];
  }
};

// Here we convert the class heading:h1 into a tag
exports.aceDomLineProcessLineAttributes = function (name, context) {
  const cls = context.cls;
  const domline = context.domline;
  const headingType = /(?:^| )heading:([A-Za-z0-9]*)/.exec(cls);
  if (headingType) {
    let tag = headingType[1];

    // backward compatibility, we used propose h5 and h6, but not anymore
    if (tag == 'h5' || tag == 'h6') tag = 'h4';

    if (_.indexOf(tags, tag) >= 0) {
      const modifier = {
        preHtml: `<${tag}>`,
        postHtml: `</${tag}>`,
        processedMarker: true,
      };
      return [modifier];
    }
  }
  return [];
};

// Find out which lines are selected and assign them the heading attribute.
// Passing a level >= 0 will set a heading on the selected lines, level < 0
// will remove it
function doInsertHeading(level) {
  const rep = this.rep;
  const documentAttributeManager = this.documentAttributeManager;
  if (!(rep.selStart && rep.selEnd) || (level >= 0 && tags[level] === undefined)) {
    return;
  }

  let firstLine, lastLine;

  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each((i) => {
    if (level >= 0) {
      documentAttributeManager.setAttributeOnLine(i, 'heading', tags[level]);
    } else {
      documentAttributeManager.removeAttributeOnLine(i, 'heading');
    }
  });
}


// Once ace is initialized, we set ace_doInsertHeading and bind it to the context
exports.aceInitialized = function (hook, context) {
  const editorInfo = context.editorInfo;
  editorInfo.ace_doInsertHeading = _(doInsertHeading).bind(context);
};

exports.aceEditorCSS = function () {
  return cssFiles;
};
