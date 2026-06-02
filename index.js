'use strict';

const {template} = require('ep_plugin_helpers');
const {lineAttributeExport} = require('ep_plugin_helpers/attributes-server');
const {settings: createSettings} = require('ep_plugin_helpers/settings');

const tags = ['h1', 'h2', 'h3', 'h4', 'code'];

const defaultFontSizes = {h1: '2.5em', h2: '1.8em', h3: '1.5em', h4: '1.2em'};

const pluginSettings = createSettings('ep_headings2', {fontSizes: defaultFontSizes});

const getFontSizes = () => {
  const fontSizes = pluginSettings.get('fontSizes') || defaultFontSizes;
  return {
    h1: fontSizes.h1 || defaultFontSizes.h1,
    h2: fontSizes.h2 || defaultFontSizes.h2,
    h3: fontSizes.h3 || defaultFontSizes.h3,
    h4: fontSizes.h4 || defaultFontSizes.h4,
  };
};

// Only used for getLineHTMLForExport; font sizes are handled dynamically below.
const headingsExport = lineAttributeExport({
  attr: 'heading',
  tags,
  normalize: (value) => (value === 'h5' || value === 'h6') ? 'h4' : value,
  exportStyles: '',
});

exports.loadSettings = pluginSettings.loadSettings;

exports.expressCreateServer = (hookName, {app}) => {
  app.get('/ep_headings2/editor.css', (req, res) => {
    const {h1, h2, h3, h4} = getFontSizes();
    res.setHeader('Content-Type', 'text/css');
    res.send(
        `#innerdocbody h1{font-size: ${h1};}\n` +
        `#innerdocbody h2{font-size: ${h2};}\n` +
        `#innerdocbody h3{font-size: ${h3};}\n` +
        `#innerdocbody h4{font-size: ${h4};}\n` +
        '#innerdocbody code{font-family: RobotoMono;}\n' +
        '#innerdocbody h1,\n' +
        '#innerdocbody h2,\n' +
        '#innerdocbody h3,\n' +
        '#innerdocbody h4 {\n' +
        '  display: inline-block;\n' +
        '}\n',
    );
  });
};

exports.eejsBlock_editbarMenuLeft = template('ep_headings2/templates/editbarButtons.ejs');

exports.stylesForExport = () => {
  const {h1, h2, h3, h4} = getFontSizes();
  return (
    `h1{font-size: ${h1};}\n` +
    `h2{font-size: ${h2};}\n` +
    `h3{font-size: ${h3};}\n` +
    `h4{font-size: ${h4};}\n` +
    'code{font-family: RobotoMono;}\n'
  );
};

exports.getLineHTMLForExport = headingsExport.getLineHTMLForExport;
