var Bet = require('./node/bet.js');
var DbLoad = require('./node/db_load.js');

var DbClient = require('./node/db_client.js');

DbClient.create();
DbLoad.load_all();
setTimeout(function(){
    BETS.forEach(function(value, key) {
	console.log(key);
	console.log(value);
    });
}, 2000);

