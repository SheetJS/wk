#!/usr/bin/env node
/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=typescript: */

import { fork } from 'child_process';

import * as blessed from 'blessed';
import { WorkBook } from 'xlsx';

import initialize from './src/';

const filename = process.argv[2];

/* init screen */
const screen: blessed.Widgets.Screen = blessed.screen({ title: "SheetJS spreadsheet viewer - " + filename });

const loader = blessed.loading({
	align: 'center',
	border: 'line',
	height: 5,
  hidden: true,
  left: 'center',
  parent: screen,
  tags: true,
  top: 'center',
  width: '50%'
});
loader.load("Loading " + filename + " ...");

const n = fork(__dirname + '/bg.js', [], { silent: true });
n.send(filename);

n.on('message', (wb: [WorkBook, Error]) => {
	loader.stop();
	if(wb[1] && wb[1].message) throw wb[1];
	n.disconnect();
	initialize(wb[0], filename, screen);
});
