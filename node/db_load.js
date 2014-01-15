var sets = require('simplesets');
var map = require('hashmap');

var Bet = require('./bet.js');
var Enums = require('./enums.js');

var BetState = Enums.BetState;
var HashMap = map.HashMap;
var Set = sets.Set;

exports.load_all = function() {
    var bets = new HashMap();
    var query = POSTGRES_CLIENT.query('SELECT DISTINCT ON (name) * FROM bets ORDER BY name, time DESC');
    query.on('error', function(err) {
	console.log('Error when loading bets from DB: ' + err);
	return;
    });
    query.on('row', function(row) {
	var participants = row.participants.split(',');
	var bet = new Bet(row.name, row.description, row.host, row.expiry, row.min_val, row.max_val, row.tick_size, false);
	bet.initTime = row.time;
	bet.participants = new Set(row.participants.split(','));
	bet.state = BetState.get(row.state);
	bets.set(row.name, bet);
    });

    query.on('end', function(result) {
	console.log('inside ' + bets);
	// Enable save after loaded from DB
	bets.forEach(function(value, key) {
	    value.doSave = true;
	});
        BETS = bets;
    });
}

