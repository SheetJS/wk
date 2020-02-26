"use strict";
/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=typescript: */
exports.__esModule = true;
var blessed = require("blessed");
function make_help(screen) {
    var help = blessed.box({ mouse: true, keys: true, top: 'center', left: 'center', width: '50%', height: '50%', content: "" });
    var helpstr = "(press any key to close this help)\n\n  CTRL+C       Exit viewer\n\n  Click cell   Jump to selected cell\n  UP/DOWN      Jump up/down 1 line\n  Mouse scrl   Jump up/down 3 lines\n  PGUP/PGDN    Jump up/down 1 page\n\n  \u00AB/\u00BB          Shrink/expand col width\n  ~ (tilde)    Select Worksheet";
    help.content = helpstr;
    return help;
}
exports["default"] = make_help;
