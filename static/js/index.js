'use strict';

const {lineAttribute} = require('ep_plugin_helpers/attributes');

const cssFiles = ['ep_headings2/static/css/editor.css'];
const tags = ['h1', 'h2', 'h3', 'h4', 'code'];

const headings = lineAttribute({
  attr: 'heading',
  tags,
  normalize: (value) => (value === 'h5' || value === 'h6') ? 'h4' : value,
});

exports.aceRegisterBlockElements = headings.aceRegisterBlockElements;
exports.aceAttribsToClasses = headings.aceAttribsToClasses;
exports.aceDomLineProcessLineAttributes = headings.aceDomLineProcessLineAttributes;

// Bind the event handler to the toolbar buttons
exports.postAceInit = (hookName, context) => {
  const hs = $('#heading-selection');
  hs.on('change', function () {
    const value = $(this).val();
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue)) {
      context.ace.callWithAce((ace) => {
        ace.ace_doInsertHeading(intValue);
      }, 'insertheading', true);
      hs.val('dummy');
    }
    // Return focus to the editor after heading selection (fixes #130)
    context.ace.focus();
  });
};

const range = (start, end) => Array.from(
    Array(Math.abs(end - start) + 1),
    (_, i) => start + i
);

// On caret position change show the current heading
exports.aceEditEvent = (hookName, call) => {
  const cs = call.callstack;
  if (!(cs.type === 'handleClick') && !(cs.type === 'handleKeyEvent') && !(cs.docTextChanged)) {
    return false;
  }
  if (cs.type === 'setBaseText' || cs.type === 'setup') return false;

  setTimeout(() => {
    const attributeManager = call.documentAttributeManager;
    const rep = call.rep;
    const activeAttributes = {};
    $('#heading-selection').val('dummy').niceSelect('update');

    const firstLine = rep.selStart[0];
    const lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
    let totalNumberOfLines = 0;

    range(firstLine, lastLine).forEach((line) => {
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
        const ind = tags.indexOf(k);
        $('#heading-selection').val(ind).niceSelect('update');
      }
    });
  }, 250);
};

// Once ace is initialized, we set ace_doInsertHeading and bind it to the context
exports.aceInitialized = (hookName, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_doInsertHeading = (level) => {
    const {documentAttributeManager, rep} = context;
    if (!(rep.selStart && rep.selEnd)) return;
    if (level >= 0 && tags[level] === undefined) return;
    const firstLine = rep.selStart[0];
    const lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));

    range(firstLine, lastLine).forEach((line) => {
      if (level >= 0) {
        documentAttributeManager.setAttributeOnLine(line, 'heading', tags[level]);
      } else {
        documentAttributeManager.removeAttributeOnLine(line, 'heading');
      }
    });
  };
};

exports.aceEditorCSS = () => cssFiles;
