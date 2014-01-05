var pg = require('pg');
var read = require('read');
var Consts = require('./consts.js');
var util = require('util');

var CREATE_TABLE_USERS_QUERY = "CREATE TABLE users ( username varchar(80)," +
                                                   " email varchar(80)," +
						   " password varchar(80)," + 
						   " join_time timestamp);";

read({prompt: 'Password: ', silent: true}, function(err, password) {
    var CONN_STRING = util.format(Consts.RDS_POSTGRES_CONN_STRING, password);
    var client = new pg.Client(CONN_STRING);
    client.connect(function(err) {
	if (err) {
	    console.error('Could not connect to postgres DB, ', err.toString());
	    client.end();
	}

	client.query(CREATE_TABLE_USERS_QUERY, function(err, result) {
	    if (err) {
		console.error('error running query', err.toString());
		client.end();
	    }
	    else {
		console.log('Users table successfully created');
		client.end();
	    }
	});
    });
});

