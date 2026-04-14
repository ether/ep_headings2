'use strict';

const {lineAttribute} = require('ep_plugin_helpers/attributes');

const tags = ['h1', 'h2', 'h3', 'h4', 'code'];

const headings = lineAttribute({attr: 'heading', tags});

exports.collectContentPre = headings.collectContentPre;
exports.collectContentPost = headings.collectContentPost;
