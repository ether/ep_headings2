'use strict';

const {template} = require('ep_plugin_helpers');
const {lineAttributeExport} = require('ep_plugin_helpers/attributes-server');

const tags = ['h1', 'h2', 'h3', 'h4', 'code'];

const headingsExport = lineAttributeExport({
  attr: 'heading',
  tags,
  normalize: (value) => (value === 'h5' || value === 'h6') ? 'h4' : value,
  exportStyles:
    'h1{font-size: 2.5em;}\n' +
    'h2{font-size: 1.8em;}\n' +
    'h3{font-size: 1.5em;}\n' +
    'h4{font-size: 1.2em;}\n' +
    'code{font-family: RobotoMono;}\n',
});

exports.eejsBlock_editbarMenuLeft = template('ep_headings2/templates/editbarButtons.ejs');
exports.stylesForExport = headingsExport.stylesForExport;
exports.getLineHTMLForExport = headingsExport.getLineHTMLForExport;
