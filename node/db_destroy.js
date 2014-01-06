var pg = require('pg');
var read = require('read');
var Consts = require('./consts.js');
var util = require('util');

var DESTROY_TABLE_USERS_QUERY = "DROP TABLE users;";
var DESTROY_TYPE_BET_STATE = "DROP TYPE bet_state;";
var DESTROY_TABLE_BETS_QUERY = "DROP TABLE bets;";
var DESTROY_TYPE_ORDER_STATE = "DROP TYPE order_state;";
var DESTROY_TABLE_ORDERS_QUERY = "DROP TABLE orders;";
var DESTROY_TABLE_TRADES_QUERY = "DROP TABLE trades;";

read({prompt: 'Password: ', silent: true}, function(err, password) {
    var CONN_STRING = util.format(Consts.RDS_POSTGRES_CONN_STRING, password);
    read({prompt: 'Type \'DESTROY\' to confirm: '}, function(err, input) {
	if (input == 'DESTROY') {
	    var client = new pg.Client(CONN_STRING);
	    client.connect(function(err) {
		if (err) {
		    console.error('Could not connect to postgres DB, ', err.toString());
		    client.end();
		}

		client.query(DESTROY_TABLE_USERS_QUERY, function(err, result) {
		    if (err) console.error('error running query', err.toString());
		    else console.log('Users table successfully destroyed');
		});

		client.query(DESTROY_TABLE_BETS_QUERY, function(err, result) {
		    if (err) console.error('error running query', err.toString());
		    else console.log('Bets table successfully destroyed');
		});

		client.query(DESTROY_TABLE_ORDERS_QUERY, function(err, result) {
		    if (err) console.error('error running query', err.toString());
		    else console.log('Orders table successfully destroyed');
		});

		client.query(DESTROY_TABLE_TRADES_QUERY, function(err, result) {
		    if (err) console.error('error running query', err.toString());
		    else console.log('Trades table successfully destroyed');
		});

		client.query(DESTROY_TYPE_BET_STATE, function(err, result) {
		    if (err) console.error('error running query', err.toString());
		    else console.log('Bet state type successfully destroyed');
		});

		client.query(DESTROY_TYPE_ORDER_STATE, function(err, result) {
		    if (err) console.error('error running query', err.toString());
		    else console.log('Order state type successfully destroyed');
		});

                client.on('drain', client.end.bind(client));
	    });
	}
	else {
	    console.log('You did not type \'DESTROY\', destruction aborted');
	}
    });
});

