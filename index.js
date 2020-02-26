#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var child_process_1 = require("child_process");
var blessed = require("blessed");
var src_1 = require("./src/");
var filename = process.argv[2];
/* init screen */
var screen = blessed.screen({ title: "SheetJS spreadsheet viewer - " + filename });
var loader = blessed.loading({
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
var n = child_process_1.fork(__dirname + '/bg.js', [], { silent: true });
n.send(filename);
n.on('message', function (wb) {
    loader.stop();
    if (wb[1] && wb[1].message)
        throw wb[1];
    n.disconnect();
    src_1["default"](wb[0], filename, screen);
});
