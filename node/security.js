var crypto = require('crypto');
var util = require('util');
var Consts = require('./consts.js');

var SHA_ALGORITHM = Consts.SHA_ALGORITHM;

var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

make_salt = function() {
    var text = "";
    for( var i=0; i < 5; i++ )
	text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

hash_str = function(s) {
    return crypto.createHmac(SHA_ALGORITHM, SECURITY_KEY).update(s).digest('hex');
}

exports.make_secure_username = function(s) {
    console.log(util.format('%s|%s', s, hash_str(s)));
    return util.format('%s|%s', s, hash_str(s));
}

exports.check_secure_username = function(s) {
   // Morgan Stanley cookie adds a string at the end of username
   if (!s) {
       return null;
   }
   var ss = s.split(';');
   if (ss.length == 0) {
       return null;
   }
   var sss = ss[0];

    var s_esc = sss.replace('%7C', '|');
    var sp = s_esc.split('|');
    if (sp.length != 2) {
	return null;
    }
    else {
	val = sp[0];
	hash = sp[1];
	if (hash_str(val) == hash) {
	    return val;
	}
	else {
	    return null;
	}
    }
}

exports.make_secure_password = function(password) {
    var salt = make_salt();
    var salted_password = util.format('%s|%s', password, salt);
    var salted_hash = hash_str(salted_password);
    return util.format('%s|%s', salted_hash, salt);
}

exports.check_secure_password = function(password, password_h) {
    var password_h_esc = password_h.replace('%7C', '|');
    var sp = password_h_esc.split('|');
    if (sp.length != 2) {
	return false;
    }
    hash = sp[0];
    salt = sp[1];
    salted_password = util.format('%s|%s', password, salt);
    return hash_str(salted_password) == hash;
}


