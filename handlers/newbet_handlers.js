var Consts = require('../node/consts.js');
var Security = require('../node/security.js');
var Enums = require('../node/enums.js');

var BetState = Enums.BetState;
var BETNAME_RE = Consts.BETNAME_RE;

exports.newbet_get = function(req, res) {
    if (!req.cookies.username) {
	console.log("No username in cookies, redirecting to signin page");
	res.redirect('/signin');
	return;
    }
    var username = Security.check_secure_username(req.cookies.username);
    if (!username) {
	console.warn("Username in cookies does not match (could have been changed manually at client side), redirecting to signin page");
	res.redirect('/signin');
	return;
    }
    var active_list = [];
    var expired_list = [];
    var settled_list = [];
    BETS.forEach(function(value, key) {
	if (value.state == BetState.ACTIVE) {
	    active_list.push(value.name);
	}
	else if (value.state == BetState.EXPIRED) {
	    expired_list.push(value.name);
	}
	else {
	    settled_list.push(value.name);
	}
    });
    res.render('new_bet', {'welcome_msg': 'Welcome ' + username + '!', 'active': active_list, 'expired': expired_list, 'settled': settled_list, 'error': ''});
    return;
};

exports.newbet_post = function(req, res) {
    if (!req.cookies.username) {
	console.log("No username in cookies, redirecting to signin page");
	res.redirect('/signin');
	return;
    }
    var username = Security.check_secure_username(req.cookies.username);
    if (!username) {
	console.warn("Username in cookies does not match (could have been changed manually at client side), redirecting to signin page");
	res.redirect('/signin');
	return;
    }
    var active_list = [];
    var expired_list = [];
    var settled_list = [];
    BETS.forEach(function(value, key) {
	if (value.state == BetState.ACTIVE) {
	    active_list.push(value.name);
	}
	else if (value.state == BetState.EXPIRED) {
	    expired_list.push(value.name);
	}
	else {
	    settled_list.push(value.name);
	}
    });
    var betname = req.body.betname;
    var description = req.body.description;
    var minval = req.body.minval;
    var maxval = req.body.maxval;
    var ticksize = req.body.ticksize;
    var expiry = req.body.expiry;

    console.log(betname);
    console.log(description);
    console.log(minval);
    console.log(maxval);
    console.log(ticksize);
    console.log(expiry);


    if (!betname || !description || !minval || !maxval || !ticksize || expiry) {
	var error = 'All fields are required';
    }
    else if (betname !== encodeURIComponent(betname)) {
	var error = 'Bet name may not contain any non-url-safe characters';
    }
    else if (!betname.match(BETNAME_RE)) {
	var error = 'Bet name should be 3-20 characters/numbers/underscore/dash';
    }
    else if (isNaN(minval)) {
	var error = 'Minimum value must be a number';
    }
    else if (isNaN(maxval)) {
	var error = 'Maximum value must be a number';
    }
    else if (isNaN(ticksize)) {
	var error = 'Tick size value must be a number';
    }

    if (error) {
	res.status(403);
	res.render('new_bet', {'welcome_msg': 'Welcome ' + username + '!', 'active': active_list, 'expired': expired_list, 'settled': settled_list, 'error':error});
	return;
    }

    //var query = POSTGRES_CLIENT.query({text: 'SELECT * FROM users where username=$1', values: [username_h]}, function(err, result) {
    //    if (err) {
    //        console.log(err);
    //        res.render('signup', {error: err});
    //        return;
    //    }
    //    if (result && result.rowCount > 0) {
    //        res.status(403);
    //        res.render('signup', {error: 'Username is already taken'});
    //        return;
    //    }
    //});

    //var query = POSTGRES_CLIENT.query({text: 'INSERT INTO users VALUES ($1, $2, $3, $4)', values: [username_h, email, password_h, new Date()]}, function(err, result) {
    //    if (err) {
    //        console.log(err);
    //        res.render('signup', {error: err});
    //        return;
    //    }
    //    else {
    //        res.cookie('username', username_h, {maxAge: 900000, httpOnly: false});
    //        res.redirect('/home');
    //        return;
    //    }
    //});
};
