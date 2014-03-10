util = require('util');
console.log(util.format('this is %s', 'a test')); 

var a = 'username=aaa%7cbbb';
var b = 'username=aaa%7cbbb; BET_=2';
console.log(a.split(';'));
console.log(b.split(';'));
