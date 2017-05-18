#!/usr/bin/env node
/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=javascript: */

import XLSX = require('xlsx');
import { sprintf } from 'printj';
import blessed = require('blessed');
import cp = require('child_process');
import ora = require('ora');

const filename:string = process.argv[2];
const spinner = ora('Loading ' + filename).start();
let colwidth = 9; // TODO: This really should be an option

const FG = '#00FF00';
const BG = 'black';
const FS = 'blue';
const BS = 'grey';

function process_wb(wb:XLSX.WorkBook) {
const base_cell:XLSX.CellAddress = {r:0, c:0};

/* grab worksheet */
let wsidx = 0;
let ws: XLSX.WorkSheet = wb.Sheets[wb.SheetNames[wsidx]];
let range: XLSX.Range = XLSX.utils.decode_range(ws['!ref']);

/* init screen */
const screen:blessed.Widgets.Screen = blessed.screen({ title:"SheetJS spreadsheet viewer - " + filename });

/* calculate number of columns required for row labels */
let colhdr = 3;
if(range.e.r >= 1000) colhdr = (1+Math.log(range.e.r) * Math.LOG10E)|0;
let ncol = ((screen.cols - colhdr)/colwidth)|0, nrow = screen.rows - 4;


const body = blessed.box({ height:'100%', width:'100%', bg:BG, fg:FG });

const H1 = blessed.box({ top:0, height:1, width:'100%', bg:FG, fg:BG, parent:body });
const H1r = blessed.text({ top:0, right:0, width:2, bg:FG, fg:BG, parent: H1 });
const H1l = blessed.text({ top:0, left:0, width:'100%-2', bg:FG, fg:BG, parent: H1 });

const H2 = blessed.box({ top:1, height:1, width:'100%', bg:FG, fg:BG, parent:body });
const H2r = blessed.text({ top:0, right:0, width:2, bg:BG, fg:FG, parent:H2 });
H2r.setContent('JS');
const H2l = blessed.text({ top:0, left:0, width:'100%-2', bg:FG, fg:BG, parent:H2 });

const H3 = blessed.box({ top:2, height:1, width:'100%', bg:BG, fg:FG, tags:true, parent:body });

const H4 = blessed.box({ top:3, height:1, width:'100%', bg:BG, fg:FG, parent:body });
const H4l = blessed.box({ top:0, height:1, width:'50%', bg:FG, fg:BG, parent:H4 });

const H5 = blessed.box({ top:4, height:'100%-4', width:colhdr, bg:FG, fg:BG, parent:body });

const D = [];
let DW = sprintf('100%%-%d', colhdr);


function center_str(s:string, w:number):string {
	if(s.length >= w) return s.substr(0,w);
	const pl = (w - s.length) >> 1;
	return new Array(pl+1).join(" ") + s + new Array(w - s.length - pl + 1).join(" ");
}

function rebuild_screen() {
	ncol = ((screen.cols - colhdr)/colwidth)|0, nrow = screen.rows - 4;
	/* row labels */
	let O = "";
	for(let i = 0; i < nrow; ++i) O += sprintf("%*s\n", colhdr, XLSX.utils.encode_row(base_cell.r + i));
	H5.setContent(O);

	/* column labels */
	H4l.width = (ncol * colwidth + colhdr);
	O = center_str("", colhdr);
	for(let i = 0; i < ncol; ++i) O += center_str(XLSX.utils.encode_col(base_cell.c + i), colwidth);
	H4l.setContent(O);

	for(let i = D.length; i < nrow; ++i) {
		D[i] = blessed.box({ top:4+i, left:colhdr, height:1, width:DW, bg:BG, fg:FG });
		body.append(D[i]);
		D[i].setContent(sprintf("haha %d", i));
	}

	for(let i = 0; i < nrow; ++i) {
		O = "";
		for(let j = 0; j < ncol; ++j) {
			let cell:XLSX.CellObject = ws[XLSX.utils.encode_cell({r:base_cell.r+i, c:base_cell.c+j})];
			let o = "";
			let fmt = "%2$ *1$.*1$s ";
			if(cell) {
				/* TODO: cell alignment */
				o = cell.w ? cell.w.substr(0,colwidth-1) : String(cell.v);
				if(cell.t == 'n') fmt = "%2$*1$" + (cell.w ? "s" : "g") + " ";
			}
			O += sprintf(fmt,colwidth-1,o);
		}
		D[i].setContent(O);
	}
}

rebuild_screen();
screen.append(body);

/* form to select worksheet */
const form = blessed.Form({ mouse:true, keys:true, top: 'center', left: 'center', width: '50%', height: '50%', content: "" });
form.setLabel('Select a Worksheet \n(hit backspace to cancel)');
const radios = [];
const radioset = blessed.RadioSet({ top:3, parent:form });
wb.SheetNames.forEach(function(n, i) {
	const radio = blessed.RadioButton({mouse:true, keys:true, top:i, left:0, width:'100%', height:1, content:n, parent:radioset, checked:i == wsidx});
	radio.on('check', () => set_worksheet(i) );
	radios.push(radio);
});
screen.append(form);

/* help screen */
const help = blessed.box({ mouse:true, keys:true, top: 'center', left: 'center', width: '50%', height: '50%', content: "" });
const helpstr = [
	'(press any key to close this help)',
	'  ',
	'  CTRL+C       Exit viewer',
	'  ',
	'  Click cell   Jump to selected cell',
	'  UP/DOWN      Jump up/down 1 line',
	'  Mouse scrl   Jump up/down 3 lines',
	'  PGUP/PGDN    Jump up/down 1 page',
	'  ',
	'  ~ (tilde)    Select Worksheet'
].join("\n");
help.content = helpstr;
screen.append(help);

function set_worksheet(n:number) {
	if(n != -1) {
		wsidx = n;
		ws = wb.Sheets[wb.SheetNames[wsidx]];
		range = XLSX.utils.decode_range(ws['!ref']);
		colhdr = (1+Math.log(Math.max(999, range.e.r)) * Math.LOG10E)|0;
		ncol = ((screen.cols - colhdr)/colwidth)|0;
		DW = sprintf('100%%-%d', colhdr);
		selcell.r = selcell.c = 0;
		move_sel_to_cell(selcell);
	}
	form.hide();
	body.focus();
	screen.render();
	rebuild_screen();
}

/* selection */
const sel = blessed.box({ top:0, left:0, height:1, width:colwidth, style: {bg:FS, fg:BS, transparent:true} });
screen.append(sel);
const selcell:XLSX.CellAddress = {r:0, c:0};

function show_version(arg?:Array<any>) {
	H2l.setContent(arg && arg[0] ? arg[0] : '(C) 2017 SheetJS http://sheetjs.com  Party like it\'s 1979');
	H3.setContent(arg && arg[1] ? arg[1] : 'Press ? for help, CTRL+C to quit');
}

/* determine whether a recentering is needed */
function recenter_screen(cell:XLSX.CellAddress) {
	let dirty = false;
	if(cell.r < base_cell.r) { base_cell.r = cell.r; dirty = true; }
	if(cell.c < base_cell.c) { base_cell.c = cell.c; dirty = true; }
	if(cell.r >= base_cell.r + nrow) { base_cell.r = cell.r - nrow + 1; dirty = true; }
	if(cell.c >= base_cell.c + ncol) { base_cell.c = cell.c - ncol + 1; dirty = true; }
	if(dirty) rebuild_screen();
}

function move_sel_to_cell(cell:XLSX.CellAddress) {
	recenter_screen(cell);
	selcell.c = cell.c; selcell.r = cell.r;
	sel.top = 4 + cell.r - base_cell.r; if(sel.top < 4) sel.top = -1;
	sel.left = colhdr + (cell.c - base_cell.c) * colwidth; if(sel.left < colhdr) sel.left = -colwidth;
	let addr:string = XLSX.utils.encode_cell(cell);
	let text:string = addr;
	if(ws[addr]) {
		text += sprintf(" (%c) |%s|", ws[addr].t, ws[addr].w||ws[addr].v);
		if(ws[addr].t == 'n' || ws[addr].t == 'd') text += sprintf(" raw %s", ws[addr].v);
		if(ws[addr].f) {
			show_version([(ws[addr].F || addr) + "=" + ws[addr].f ]);
		} else if(ws[addr].F) {
			const base_c = XLSX.utils.encode_cell(XLSX.utils.decode_range(ws[addr].F).s);
			show_version([ws[addr].F + "=" + ws[base_c].f ]);
		} else show_version();
	} else { text += sprintf(" EMPTY"); show_version(); }
	H1l.setText(text);
}

function find_coord(r:number, c:number):XLSX.CellAddress {
	if(r < 4 || c < colhdr || c >= colhdr + ncol * colwidth) return null;
	return {r:base_cell.r + r - 4, c:base_cell.c + ((c - colhdr) / colwidth)|0 };
}

function init() {
	H1r.setText('C');
	base_cell.r = base_cell.c = 0;
	H1l.setText('??');
	show_version();
	move_sel_to_cell(base_cell);
	screen.render();
}

body.on('mouse', function(mouse) {
	if(help.visible) {
		if(mouse.action == 'mousemove') return;
		help.hide(); screen.render(); return;
	}
	if(form.visible) return;
	let cell:XLSX.CellAddress = {r:selcell.r, c:selcell.c};
	switch(mouse.action) {
		case 'wheeldown':
			cell.r += 3;
			if(cell.r > range.e.r) cell.r = range.e.r;
			move_sel_to_cell(cell);
			break;
		case 'wheelup':
			cell.r -= 3;
			if(cell.r < 0) cell.r = 0;
			move_sel_to_cell(cell);
			break;
		case 'mousedown':
		case 'mouseup':
			const cc = find_coord(mouse.y, mouse.x);
			if(cc) move_sel_to_cell(cc);
	}
	screen.render();
});


screen.on('keypress', function(ch, key) {
	let movesel = false;

	if(help.visible) { help.hide(); screen.render(); return; }

	if(form.visible) {
		if(key.name == "backspace") set_worksheet(-1);
		else if(key.sequence && key.sequence.length == 1 && !key.ctrl && !key.meta) {
			if(key.sequence.charCodeAt(0) == 0x1D) set_worksheet(-1);
		}
		screen.render(); return;
	}

	if(key.name == "pageup") {
		if(selcell.r == 0) return;
		selcell.r -= screen.rows - 4;
		if(selcell.r < 0) selcell.r = 0;
		move_sel_to_cell(selcell);
		screen.render();
	} else if(key.name == "pagedown") {
		if(selcell.r == range.e.r) return;
		selcell.r += screen.rows - 4;
		if(selcell.r > range.e.r) selcell.r = range.e.r;
		move_sel_to_cell(selcell);
		screen.render();
	} else if(key.sequence) {
		if(key.sequence.length == 1 && !key.ctrl && !key.meta) {
			switch(key.sequence.charCodeAt(0)) {
				case 0x1D: /* escape */ screen.render(); break;
				case 0x3F: /* ? */ help.show(); help.setFront(); screen.render(); break;
			}
		}
		else if(key.sequence.length == 3 && key.sequence.substr(1,1) == "O") {
			switch(key.sequence.substr(2,1)) {
				case "A": /* up arrow */
					if(selcell.r > 0) { movesel = true; --selcell.r; } break;
				case "B": /* down arrow */
					if(selcell.r < range.e.r) { movesel = true; ++selcell.r; } break;
				case "C": /* right arrow */
					if(selcell.c < range.e.c) { movesel = true; ++selcell.c; } break;
				case "D": /* left arrow */
					if(selcell.c > 0) { movesel = true; --selcell.c; } break;
				case "H": /* home */
					movesel = true; selcell.r = selcell.c = 0; break;
				case "F": /* end */
					movesel = true; selcell.r = range.e.r; selcell.c = range.e.c; break;
			}
			if(movesel) { move_sel_to_cell(selcell); screen.render(); }
		}
	} else if(key.ch) {
		switch(key.ch.charCodeAt(0)) {
			case 0x7E: /* ~ */ form.show(); form.setFront(); form.focus(); screen.render(); break;
			case 0x3F: /* ? */help.show(); help.setFront(); screen.render(); break;
		}
	}
});

screen.key(['C-c'], (ch, key) => process.exit(0) );

process.on('SIGWINCH', () => rebuild_screen() );

init();
show_version();
body.focus();
form.hide();
help.hide();
screen.render();
}

const n = cp.fork('./bg.js');
n.send(filename);

n.on('message', (wb:[XLSX.WorkBook, Error]) => {
	spinner.stop();
	if(wb[1] && wb[1].message) throw wb[1];
	process_wb(wb[0]);
});
