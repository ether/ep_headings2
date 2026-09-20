'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const ejs = require('ep_etherpad-lite/node_modules/ejs');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const render = (name) => ejs.render(fs.readFileSync(path.join(root, 'templates', name), 'utf8'), {});
const locales = JSON.parse(fs.readFileSync(path.join(root, 'locales', 'en.json'), 'utf8'));
const epJson = JSON.parse(fs.readFileSync(path.join(root, 'ep.json'), 'utf8'));

// Every <option value=...> with the localization id of its label.
const options = (html) => {
  const found = {};
  const re = /<option value="([^"]+)"[^>]*data-l10n-id="([^"]+)"/g;
  for (let m = re.exec(html); m; m = re.exec(html)) found[m[1]] = m[2];
  return found;
};

describe(__filename, function () {
  let fileMenu;

  before(function () {
    fileMenu = render('fileMenu.ejs');
  });

  // https://github.com/ether/ep_headings2/issues/52
  it('file menu offers the same styles as the editbar', function () {
    assert.deepEqual(options(fileMenu), options(render('editbarButtons.ejs')));
  });

  it('the styles are localized', function () {
    const ids = Object.values(options(fileMenu));
    assert(ids.length > 1, `no localized options in the file menu:\n${fileMenu}`);
    for (const id of ids) assert(locales[id], `${id} is missing from locales/en.json`);
  });

  it('the file menu select is found by class, not by a duplicate id', function () {
    // postAceInit binds '#heading-selection, select.heading-selection'. Reusing
    // the editbar's id here would give the page two elements with the same id
    // and only the first would ever be updated.
    assert.match(fileMenu, /<select[^>]*class="[^"]*\bheading-selection\b/);
    assert(!fileMenu.includes('id="heading-selection"'),
        'the file menu select must not reuse the editbar select id');
  });

  it('registers the entry in the paragraph formatting group', function () {
    // dd_format_block is the block right below Outdent in
    // ep_file_menu_toolbar's Format menu.
    assert.equal(epJson.parts[0].hooks.eejsBlock_dd_format_block, 'ep_headings2/index');
    assert.equal(typeof require(root).eejsBlock_dd_format_block, 'function');
  });
});
