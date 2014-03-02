var moment = require('moment');
moment().format();

var d = new Date('2014-03-02T14:00:00.000-05:00');
console.log(moment(d));

var d1 = moment();
var d2 = moment().add('s', 2);
console.log(d2-d1);
setTimeout(function() { console.log("blabla"); }, d2 - d1);
