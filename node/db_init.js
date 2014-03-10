var pg = require('pg');
var read = require('read');
var Consts = require('./consts.js');
var util = require('util');

var CREATE_TYPE_BET_STATE = "CREATE TYPE bet_state AS ENUM (\'ACTIVE\', \'EXPIRED\', \'SETTLED\');";
var CREATE_TYPE_ORDER_STATE = "CREATE TYPE order_state AS ENUM (\'ACTIVE\', \'PARTIALLYFILLED\'," +
                                                      " \'FILLED\', \'CANCELLED\', \'EXPIRED\');";
var CREATE_TABLE_USERS_QUERY = "CREATE TABLE users ( username varchar(60)," +
                                                   " email varchar(40)," +
						   " password varchar(60)," + 
						   " time timestamp);";
var CREATE_TABLE_BETS_QUERY = "CREATE TABLE bets ( id serial primary key," + 
                                                 " name varchar(40)," +
                                                 " time timestamp," +
                                                 " description varchar(500)," +
                                                 " participants varchar(200)," +
                                                 " state bet_state," +
						 " expiry timestamp," + 
						 " min_val real," + 
						 " max_val real," + 
						 " tick_size real," + 
						 " settle_value real," + 
						 " host varchar(60));";
var CREATE_TABLE_ORDERS_QUERY = "CREATE TABLE orders ( id serial primary key," + 
                                                     "bet_name varchar(40)," +
                                                     " username varchar(60)," +
                                                     " is_bid boolean," +
                                                     " price real," +
                                                     " state order_state," +
                                                     " size int," +
                                                     " remaining_size int," +
                                                     " uid uuid," +
                                                     " time timestamp);";
var CREATE_TABLE_TRADES_QUERY = "CREATE TABLE trades ( id serial primary key," +
                                                     "bet_name varchar(40)," +
                                                     " long_user varchar(60)," +
                                                     " short_user varchar(60)," +
                                                     " uid uuid," +
                                                     " price real," +
                                                     " size int," +
                                                     " time timestamp);";

read({prompt: 'Password: ', silent: true}, function(err, password) {
    var CONN_STRING = util.format(Consts.RDS_POSTGRES_CONN_STRING, password);
    var client = new pg.Client(CONN_STRING);
    client.connect(function(err) {
	if (err) {
	    console.error('Could not connect to postgres DB, ', err.toString());
	    client.end();
	}

	client.query(CREATE_TYPE_BET_STATE, function(err, result) {
	    if (err) console.error('error running query', err.toString());
	    else console.log('Bet state type successfully created');
	});

	client.query(CREATE_TYPE_ORDER_STATE, function(err, result) {
	    if (err) console.error('error running query', err.toString());
	    else console.log('Order state type successfully created');
	});

	client.query(CREATE_TABLE_USERS_QUERY, function(err, result) {
	    if (err) console.error('error running query', err.toString());
	    else console.log('Users table successfully created');
	});

	client.query(CREATE_TABLE_BETS_QUERY, function(err, result) {
	    if (err) console.error('error running query', err.toString());
	    else console.log('Bets table successfully created');
	});

	client.query(CREATE_TABLE_ORDERS_QUERY, function(err, result) {
	    if (err) console.error('error running query', err.toString());
	    else console.log('Orders table successfully created');
	});

	client.query(CREATE_TABLE_TRADES_QUERY, function(err, result) {
	    if (err) console.error('error running query', err.toString());
	    else console.log('Trades table successfully created');
	});
    });
    client.on('drain', client.end.bind(client));
});

