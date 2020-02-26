"use strict";
/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=typescript: */
exports.__esModule = true;
var blessed = require("blessed");
var printj_1 = require("printj");
var XLSX = require("xlsx");
var util_1 = require("./util");
var help_1 = require("./help");
var FG = '#00FF00';
var BG = 'black';
var FS = 'blue';
var BS = 'grey';
var colwidth = 8;
colwidth = 9;
var base_cell = { r: 0, c: 0 };
/* worksheet info */
var wsidx = 0;
var ws;
var range;
/* number of columns for row labels */
var colhdr = 3;
var ncol = 123;
var nrow = 123;
var DW = "";
function update_wsidx(wb, screen) {
    ws = wb.Sheets[wb.SheetNames[wsidx]];
    range = XLSX.utils.decode_range(ws['!ref']);
    colhdr = 3;
    if (range.e.r >= 1000)
        colhdr = (1 + Math.log(range.e.r) * Math.LOG10E) | 0;
    ncol = ((screen.cols - colhdr) / colwidth) | 0;
    nrow = screen.rows - 4;
    DW = printj_1.sprintf('100%%-%d', colhdr);
}
function initialize(wb, filename, screen) {
    update_wsidx(wb, screen);
    var body = blessed.box({ height: '100%', width: '100%', bg: BG, fg: FG });
    var H1 = blessed.box({ top: 0, height: 1, width: '100%', bg: FG, fg: BG, parent: body });
    var H1r = blessed.text({ top: 0, right: 0, width: 2, bg: FG, fg: BG, parent: H1 });
    var H1l = blessed.text({ top: 0, left: 0, width: '100%-2', bg: FG, fg: BG, parent: H1 });
    var H2 = blessed.box({ top: 1, height: 1, width: '100%', bg: FG, fg: BG, parent: body });
    var H2r = blessed.text({ top: 0, right: 0, width: 2, bg: BG, fg: FG, parent: H2 });
    var H2l = blessed.text({ top: 0, left: 0, width: '100%-2', bg: FG, fg: BG, parent: H2 });
    var H3 = blessed.box({ top: 2, height: 1, width: '100%', bg: BG, fg: FG, tags: true, parent: body });
    var H4 = blessed.box({ top: 3, height: 1, width: '100%', bg: BG, fg: FG, parent: body });
    var H4l = blessed.box({ top: 0, height: 1, width: '50%', bg: FG, fg: BG, parent: H4 });
    var H5 = blessed.box({ top: 4, height: '100%-4', width: colhdr, bg: FG, fg: BG, parent: body });
    H2r.setContent('JS');
    var D = [];
    function rebuild_screen() {
        var O = "";
        ncol = ((screen.cols - colhdr) / colwidth) | 0;
        nrow = screen.rows - 4;
        /* row labels */
        for (var i = 0; i < nrow; ++i)
            O += printj_1.sprintf("%*s\n", colhdr, XLSX.utils.encode_row(base_cell.r + i));
        H5.setContent(O);
        /* column labels */
        H4l.width = (ncol * colwidth + colhdr);
        O = util_1.center_str("", colhdr);
        for (var i = 0; i < ncol; ++i)
            O += util_1.center_str(XLSX.utils.encode_col(base_cell.c + i), colwidth);
        H4l.setContent(O);
        for (var i = D.length; i < nrow; ++i) {
            D[i] = blessed.box({ top: 4 + i, left: colhdr, height: 1, width: DW, bg: BG, fg: FG });
            body.append(D[i]);
            D[i].setContent(printj_1.sprintf("haha %d", i));
        }
        var fmt = "%2$ *1$.*1$s ";
        for (var i = 0; i < nrow; ++i) {
            O = "";
            for (var j = 0; j < ncol; ++j) {
                var cell = ws[XLSX.utils.encode_cell({ r: base_cell.r + i, c: base_cell.c + j })];
                var o = "";
                if (cell) {
                    /* TODO: cell alignment */
                    o = cell.w ? cell.w : String(cell.v);
                    switch (cell.t) {
                        case 'n':
                            if (!cell.w)
                                o = printj_1.sprintf("%2$*1$g", colwidth - 1, cell.v);
                        /* falls through */
                        case 'd':
                            o = util_1.right_str(o, colwidth - 1);
                            break;
                        case 's':
                            o = util_1.left_str(o, colwidth + 1);
                            break;
                        case 'b':
                        case 'e':
                            o = util_1.center_str(o, colwidth - 1);
                            break;
                        case 'z':
                            o = "";
                            break;
                    }
                }
                O += printj_1.sprintf(fmt, colwidth - 1, o);
            }
            D[i].setContent(O);
        }
    }
    rebuild_screen();
    screen.append(body);
    /* form to select worksheet */
    var form = (function () {
        var _form = blessed.form({ mouse: true, keys: true, top: 'center', left: 'center', width: '50%', height: '50%', content: "" });
        _form.setLabel('Select a Worksheet \n(hit backspace to cancel)');
        var radios = [];
        var radioset = blessed.radioset({ top: 3, parent: _form });
        wb.SheetNames.forEach(function (wsname, i) {
            var radio = blessed.radiobutton({ mouse: true, keys: true, top: i, left: 0, width: '100%', height: 1, content: wsname, parent: radioset, checked: i === wsidx });
            radio.on('check', function () { return set_worksheet(i); });
            radios.push(radio);
        });
        return _form;
    })();
    screen.append(form);
    form.hide();
    /* help screen */
    var help = help_1["default"](screen);
    screen.append(help);
    help.hide();
    function set_worksheet(_wsidx) {
        if (_wsidx !== -1) {
            wsidx = _wsidx;
            update_wsidx(wb, screen);
            selcell.r = selcell.c = 0;
            move_sel_to_cell(selcell);
        }
        form.hide();
        body.focus();
        screen.render();
        rebuild_screen();
    }
    /* selection */
    var sel = blessed.box({ top: 0, left: 0, height: 1, width: colwidth, style: { bg: FS, fg: BS, transparent: true } });
    screen.append(sel);
    var selcell = { r: 0, c: 0 };
    function show_version(arg) {
        H2l.setContent(arg && arg[0] ? arg[0] : '(C) SheetJS http://sheetjs.com  Party like it\'s 1979');
        H3.setContent(arg && arg[1] ? arg[1] : 'Press ? for help, CTRL+C to quit');
    }
    /* determine whether a recentering is needed */
    function recenter_screen(cell) {
        var dirty = false;
        if (cell.r < base_cell.r) {
            base_cell.r = cell.r;
            dirty = true;
        }
        if (cell.c < base_cell.c) {
            base_cell.c = cell.c;
            dirty = true;
        }
        if (cell.r >= base_cell.r + nrow) {
            base_cell.r = cell.r - nrow + 1;
            dirty = true;
        }
        if (cell.c >= base_cell.c + ncol) {
            base_cell.c = cell.c - ncol + 1;
            dirty = true;
        }
        return dirty;
    }
    function move_sel_to_cell(cell) {
        if (recenter_screen(cell))
            rebuild_screen();
        selcell.c = cell.c;
        selcell.r = cell.r;
        sel.top = 4 + cell.r - base_cell.r;
        if (sel.top < 4)
            sel.top = -1;
        sel.left = colhdr + (cell.c - base_cell.c) * colwidth;
        if (sel.left < colhdr)
            sel.left = -colwidth;
        var addr = XLSX.utils.encode_cell(cell);
        var text = addr;
        if (ws[addr]) {
            text += printj_1.sprintf(" (%c) |%s|", ws[addr].t, ws[addr].w || ws[addr].v);
            if (ws[addr].t === 'n' || ws[addr].t === 'd')
                text += printj_1.sprintf(" raw %s", ws[addr].v);
            if (ws[addr].f) {
                show_version([(ws[addr].F || addr) + "=" + ws[addr].f]);
            }
            else if (ws[addr].F) {
                var base_c = XLSX.utils.encode_cell(XLSX.utils.decode_range(ws[addr].F).s);
                show_version([ws[addr].F + "=" + ws[base_c].f]);
            }
            else
                show_version();
        }
        else {
            text += printj_1.sprintf(" EMPTY");
            show_version();
        }
        H1l.setText(text);
    }
    function find_coord(r, c) {
        if (r < 4 || c < colhdr || c >= colhdr + ncol * colwidth)
            return null;
        return { r: base_cell.r + r - 4, c: base_cell.c + ((c - colhdr) / colwidth) | 0 };
    }
    function init() {
        H1r.setText('C');
        base_cell.r = base_cell.c = 0;
        H1l.setText('??');
        show_version();
        move_sel_to_cell(base_cell);
        screen.render();
    }
    body.on('mouse', function (mouse) {
        if (help.visible) {
            if (mouse.action === 'mousemove')
                return;
            help.hide();
            screen.render();
            return;
        }
        if (form.visible)
            return;
        var cell = { r: selcell.r, c: selcell.c };
        switch (mouse.action) {
            case 'wheeldown':
                if (mouse.ctrl) {
                    // pass
                }
                else {
                    cell.r += 3;
                    if (cell.r > range.e.r)
                        cell.r = range.e.r;
                    move_sel_to_cell(cell);
                }
                break;
            case 'wheelup':
                if (mouse.ctrl) {
                    // pass
                }
                else {
                    cell.r -= 3;
                    if (cell.r < 0)
                        cell.r = 0;
                    move_sel_to_cell(cell);
                }
                break;
            case 'mousedown':
            case 'mouseup':
                var cc = find_coord(mouse.y, mouse.x);
                if (cc)
                    move_sel_to_cell(cc);
                break;
            case 'mousemove': break;
            default: throw new Error("Unsupported action: " + mouse.action);
        }
        screen.render();
    });
    screen.on('keypress', function (ch, key) {
        var movesel = false;
        if (help.visible) {
            help.hide();
            screen.render();
            return;
        }
        if (form.visible) {
            if (key.name === "backspace")
                set_worksheet(-1);
            else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
                if (key.sequence.charCodeAt(0) === 0x1D)
                    set_worksheet(-1);
            }
            screen.render();
            return;
        }
        if (key.name === "pageup") {
            if (selcell.r === 0)
                return;
            selcell.r -= screen.rows - 4;
            if (selcell.r < 0)
                selcell.r = 0;
            move_sel_to_cell(selcell);
            screen.render();
        }
        else if (key.name === "pagedown") {
            if (selcell.r === range.e.r)
                return;
            selcell.r += screen.rows - 4;
            if (selcell.r > range.e.r)
                selcell.r = range.e.r;
            move_sel_to_cell(selcell);
            screen.render();
        }
        else if (ch === "»" || ch === "«") {
            colwidth += (ch === "»") ? 1 : -1;
            if (colwidth > 20)
                colwidth = 20;
            if (colwidth < 6)
                colwidth = 6;
            sel.width = colwidth;
            move_sel_to_cell(selcell);
            rebuild_screen();
            screen.render();
        }
        else if (key.sequence) {
            if (key.sequence.length === 1 && !key.ctrl && !key.meta) {
                switch (key.sequence.charCodeAt(0)) {
                    case 0x1D: /* escape */
                        screen.render();
                        break;
                    case 0x3F: /* ? */
                        help.show();
                        help.setFront();
                        help.focus();
                        screen.render();
                        break;
                }
            }
            else if (key.sequence.length === 3 && key.sequence.substr(1, 1) === "O") {
                switch (key.sequence.substr(2, 1)) {
                    case "A": /* up arrow */
                        if (selcell.r > 0) {
                            movesel = true;
                            --selcell.r;
                        }
                        break;
                    case "B": /* down arrow */
                        if (selcell.r < range.e.r) {
                            movesel = true;
                            ++selcell.r;
                        }
                        break;
                    case "C": /* right arrow */
                        if (selcell.c < range.e.c) {
                            movesel = true;
                            ++selcell.c;
                        }
                        break;
                    case "D": /* left arrow */
                        if (selcell.c > 0) {
                            movesel = true;
                            --selcell.c;
                        }
                        break;
                    case "H": /* home */
                        movesel = true;
                        selcell.r = selcell.c = 0;
                        break;
                    case "F": /* end */
                        movesel = true;
                        selcell.r = range.e.r;
                        selcell.c = range.e.c;
                        break;
                }
                if (movesel) {
                    move_sel_to_cell(selcell);
                    screen.render();
                }
            }
        }
        else if (key.ch) {
            switch (key.ch.charCodeAt(0)) {
                case 0x7E: /* ~ */
                    form.show();
                    form.setFront();
                    form.focus();
                    screen.render();
                    break;
                case 0x3F: /* ? */
                    help.show();
                    help.setFront();
                    help.focus();
                    screen.render();
                    break;
            }
        }
    });
    screen.key(['C-c'], function (ch, key) { screen.destroy(); });
    process.on('SIGWINCH', function () { return rebuild_screen(); });
    init();
    show_version();
    body.focus();
    screen.render();
}
exports["default"] = initialize;
