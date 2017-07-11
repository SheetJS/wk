/* wk.js (C) 2017-present  SheetJS -- http://sheetjs.com */
/* vim: set ts=2 ft=typescript: */
var XLSX = require('xlsx');
process.on('message', (filename) => {
	try {
    const wb = XLSX.readFile(filename, {cellStyles: true, cellDates: true, cellFormula: true});
    process.send([wb, null]);
  } catch(e) {
    process.send([null, e]);
  }
});