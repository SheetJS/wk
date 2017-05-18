var XLSX = require('xlsx');
process.on('message', function(filename) {
	try {
    var wb = XLSX.readFile(filename);
    process.send([wb, null]);
  } catch(e) {
    process.send([null, e]);
  }
});
