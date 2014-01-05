var pg = require('pg');
var read = require('read');
var Consts = require('./consts.js');
var util = require('util');

var DESTROY_TABLE_USERS_QUERY = "DROP TABLE users;";

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
		    if (err) {
			console.error('error running query', err.toString());
			client.end();
		    }
		    else {
			console.log('Users table successfully destroyed');
			client.end();
		    }
		});
	    });
	}
	else {
	    console.log('You did not type \'DESTROY\', destruction aborted');
	}
    });
});

