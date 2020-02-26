/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=typescript: */

import * as blessed from 'blessed';

export default function make_help(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  const help: blessed.Widgets.BoxElement = blessed.box({ mouse:true, keys:true, top: 'center', left: 'center', width: '50%', height: '50%', content: "" });
  const helpstr = `\
(press any key to close this help)

  CTRL+C       Exit viewer

  Click cell   Jump to selected cell
  UP/DOWN      Jump up/down 1 line
  Mouse scrl   Jump up/down 3 lines
  PGUP/PGDN    Jump up/down 1 page

  «/»          Shrink/expand col width
  ~ (tilde)    Select Worksheet\
`;
  help.content = helpstr;
  return help;
}
