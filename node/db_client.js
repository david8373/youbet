var read = require('read');
var pg = require('pg');
var util = require('util');

var Consts = require('./consts.js');

exports.create = function(password, seckey) {
    var CONN_STRING = util.format(Consts.RDS_POSTGRES_CONN_STRING, password);
    SECURITY_KEY = seckey;
    POSTGRES_CLIENT = new pg.Client(CONN_STRING);
    POSTGRES_CLIENT.connect();
    console.log('DB client created');
}

