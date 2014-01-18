var Async = require('async');

var param1 = 'foobar'
function withParams(param1, callback) {
    console.log('withParams function called')
	console.log(param1)
	callback()
}
function withoutParams(callback) {
    console.log('withoutParams function called')
	callback()
}
Async.series([
	function(callback) {
	    console.log('aaa');
	    callback();
	},
	function(callback) {
	    console.log('aaa');
	    callback();
	}]);
