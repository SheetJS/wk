/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=typescript: */

import * as blessed from 'blessed';
import { sprintf } from 'printj';
import * as XLSX from 'xlsx';

import { center_str, left_str, right_str } from './util';

import make_help from './help';

const FG = '#00FF00';
const BG = 'black';
const FS = 'blue';
const BS = 'grey';

let colwidth = 8;
colwidth = 9;

const base_cell: XLSX.CellAddress = {r:0, c:0};

/* worksheet info */
let wsidx = 0;
let ws: XLSX.WorkSheet;
let range: XLSX.Range;

/* number of columns for row labels */
let colhdr = 3;
let ncol = 123;
let nrow = 123;

let DW = "";
function update_wsidx(wb: XLSX.WorkBook, screen: blessed.Widgets.Screen) {
	ws = wb.Sheets[wb.SheetNames[wsidx]];
	range = XLSX.utils.decode_range(ws['!ref']);
	colhdr = 3;
	if(range.e.r >= 1000) colhdr = (1 + Math.log(range.e.r) * Math.LOG10E) | 0;
	ncol = ((screen.cols - colhdr)/colwidth)|0;
	nrow = screen.rows - 4;
	DW = sprintf('100%%-%d', colhdr);
}

export default function initialize(wb: XLSX.WorkBook, filename: string, screen: blessed.Widgets.Screen): void {
	update_wsidx(wb, screen);

	const body = blessed.box({ height:'100%', width:'100%', bg:BG, fg:FG });

	const H1 = blessed.box({ top:0, height:1, width:'100%', bg:FG, fg:BG, parent:body });
	const H1r = blessed.text({ top:0, right:0, width:2, bg:FG, fg:BG, parent: H1 });
	const H1l = blessed.text({ top:0, left:0, width:'100%-2', bg:FG, fg:BG, parent: H1 });

	const H2 = blessed.box({ top:1, height:1, width:'100%', bg:FG, fg:BG, parent:body });
	const H2r = blessed.text({ top:0, right:0, width:2, bg:BG, fg:FG, parent:H2 });
	const H2l = blessed.text({ top:0, left:0, width:'100%-2', bg:FG, fg:BG, parent:H2 });

	const H3 = blessed.box({ top:2, height:1, width:'100%', bg:BG, fg:FG, tags:true, parent:body });

	const H4 = blessed.box({ top:3, height:1, width:'100%', bg:BG, fg:FG, parent:body });
	const H4l = blessed.box({ top:0, height:1, width:'50%', bg:FG, fg:BG, parent:H4 });

	const H5 = blessed.box({ top:4, height:'100%-4', width:colhdr, bg:FG, fg:BG, parent:body });

	H2r.setContent('JS');

	const D: blessed.Widgets.BoxElement[] = [];

	function rebuild_screen(): void {
		let O = "";
		ncol = ((screen.cols - colhdr)/colwidth)|0;
		nrow = screen.rows - 4;

		/* row labels */
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

		const fmt = "%2$ *1$.*1$s ";
		for(let i = 0; i < nrow; ++i) {
			O = "";
			for(let j = 0; j < ncol; ++j) {
				const cell: XLSX.CellObject = ws[XLSX.utils.encode_cell({r:base_cell.r+i, c:base_cell.c+j})];
				let o = "";
				if(cell) {
					/* TODO: cell alignment */
					o = cell.w ? cell.w : String(cell.v);
					switch(cell.t) {
						case 'n':
							if(!cell.w) o = sprintf("%2$*1$g", colwidth-1, cell.v);
							/* falls through */
						case 'd':
							o = right_str(o, colwidth - 1); break;
						case 's': o = left_str(o, colwidth + 1); break;
						case 'b': case 'e': o = center_str(o, colwidth - 1); break;
						case 'z': o = ""; break;
					}
				}
				O += sprintf(fmt,colwidth-1,o);
			}
			D[i].setContent(O);
		}
	}

	rebuild_screen();
	screen.append(body);

	/* form to select worksheet */
	const form: blessed.Widgets.FormElement<any> = (() => {
		const _form = blessed.form({ mouse:true, keys:true, top: 'center', left: 'center', width: '50%', height: '50%', content: "" });
		_form.setLabel('Select a Worksheet \n(hit backspace to cancel)');
		const radios: blessed.Widgets.RadioButtonElement[] = [];
		const radioset: blessed.Widgets.RadioSetElement = blessed.radioset({ top:3, parent:_form });
		wb.SheetNames.forEach((wsname, i) => {
			const radio: blessed.Widgets.RadioButtonElement = blessed.radiobutton({mouse:true, keys:true, top:i, left:0, width:'100%', height:1, content:wsname, parent:radioset, checked:i === wsidx});
			radio.on('check', () => set_worksheet(i) );
			radios.push(radio);
		});
		return _form;
	})();
	screen.append(form);
	form.hide();

	/* help screen */
	const help = make_help(screen);
	screen.append(help);
	help.hide();

	function set_worksheet(_wsidx: number): void {
		if(_wsidx !== -1) {
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
	const sel = blessed.box({ top:0, left:0, height:1, width:colwidth, style: {bg:FS, fg:BS, transparent:true} });
	screen.append(sel);
	const selcell: XLSX.CellAddress = {r:0, c:0};

	function show_version(arg?: any[]) {
		H2l.setContent(arg && arg[0] ? arg[0] : '(C) SheetJS http://sheetjs.com  Party like it\'s 1979');
		H3.setContent(arg && arg[1] ? arg[1] : 'Press ? for help, CTRL+C to quit');
	}

	/* determine whether a recentering is needed */
	function recenter_screen(cell: XLSX.CellAddress): boolean {
		let dirty = false;
		if(cell.r < base_cell.r) { base_cell.r = cell.r; dirty = true; }
		if(cell.c < base_cell.c) { base_cell.c = cell.c; dirty = true; }
		if(cell.r >= base_cell.r + nrow) { base_cell.r = cell.r - nrow + 1; dirty = true; }
		if(cell.c >= base_cell.c + ncol) { base_cell.c = cell.c - ncol + 1; dirty = true; }
		return dirty;
	}

	function move_sel_to_cell(cell: XLSX.CellAddress): void {
		if(recenter_screen(cell)) rebuild_screen();
		selcell.c = cell.c; selcell.r = cell.r;
		sel.top = 4 + cell.r - base_cell.r; if(sel.top < 4) sel.top = -1;
		sel.left = colhdr + (cell.c - base_cell.c) * colwidth; if(sel.left < colhdr) sel.left = -colwidth;
		const addr = XLSX.utils.encode_cell(cell);
		let text = addr;
		if(ws[addr]) {
			text += sprintf(" (%c) |%s|", ws[addr].t, ws[addr].w||ws[addr].v);
			if(ws[addr].t === 'n' || ws[addr].t === 'd') text += sprintf(" raw %s", ws[addr].v);
			if(ws[addr].f) {
				show_version([(ws[addr].F || addr) + "=" + ws[addr].f ]);
			} else if(ws[addr].F) {
				const base_c = XLSX.utils.encode_cell(XLSX.utils.decode_range(ws[addr].F).s);
				show_version([ws[addr].F + "=" + ws[base_c].f ]);
			} else show_version();
		} else { text += sprintf(" EMPTY"); show_version(); }
		H1l.setText(text);
	}

	function find_coord(r: number, c: number): XLSX.CellAddress {
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

	body.on('mouse', (mouse) => {
		if(help.visible) {
			if(mouse.action === 'mousemove') return;
			help.hide(); screen.render(); return;
		}
		if(form.visible) return;
		const cell: XLSX.CellAddress = {r:selcell.r, c:selcell.c};
		switch(mouse.action) {
			case 'wheeldown':
				if(mouse.ctrl) {
					// pass
				} else {
					cell.r += 3;
					if(cell.r > range.e.r) cell.r = range.e.r;
					move_sel_to_cell(cell);
				}
				break;
			case 'wheelup':
				if(mouse.ctrl) {
					// pass
				} else {
					cell.r -= 3;
					if(cell.r < 0) cell.r = 0;
					move_sel_to_cell(cell);
				}
				break;
			case 'mousedown':
			case 'mouseup':
				const cc = find_coord(mouse.y, mouse.x);
				if(cc) move_sel_to_cell(cc);
				break;
			case 'mousemove': break;
			default: throw new Error("Unsupported action: " + mouse.action);
		}
		screen.render();
	});

	screen.on('keypress', (ch: string, key) => {
		let movesel = false;

		if(help.visible) { help.hide(); screen.render(); return; }

		if(form.visible) {
			if(key.name === "backspace") set_worksheet(-1);
			else if(key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
				if(key.sequence.charCodeAt(0) === 0x1D) set_worksheet(-1);
			}
			screen.render(); return;
		}
		if(key.name === "pageup") {
			if(selcell.r === 0) return;
			selcell.r -= screen.rows - 4;
			if(selcell.r < 0) selcell.r = 0;
			move_sel_to_cell(selcell);
			screen.render();
		} else if(key.name === "pagedown") {
			if(selcell.r === range.e.r) return;
			selcell.r += screen.rows - 4;
			if(selcell.r > range.e.r) selcell.r = range.e.r;
			move_sel_to_cell(selcell);
			screen.render();
		} else if(ch === "»" || ch === "«") {
			colwidth += (ch === "»") ? 1 : -1;
			if(colwidth > 20) colwidth = 20;
			if(colwidth < 6) colwidth = 6;
			sel.width = colwidth;
			move_sel_to_cell(selcell);
			rebuild_screen(); screen.render();
		} else if(key.sequence) {
			if(key.sequence.length === 1 && !key.ctrl && !key.meta) {
				switch(key.sequence.charCodeAt(0)) {
					case 0x1D: /* escape */ screen.render(); break;
					case 0x3F: /* ? */ help.show(); help.setFront(); help.focus(); screen.render(); break;
				}
			} else if(key.sequence.length === 3 && key.sequence.substr(1,1) === "O") {
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
		} else if((key as any).ch) {
			switch((key as any).ch.charCodeAt(0)) {
				case 0x7E: /* ~ */ form.show(); form.setFront(); form.focus(); screen.render(); break;
				case 0x3F: /* ? */ help.show(); help.setFront(); help.focus(); screen.render(); break;
			}
		}
	});

	screen.key(['C-c'], (ch, key) => { screen.destroy(); });

	process.on('SIGWINCH', () => rebuild_screen() );

	init();
	show_version();
	body.focus();
	screen.render();
}
