var Security = require('../node/security.js');

var Enums = require('../node/enums.js');

var BetState = Enums.BetState;

exports.home_get = function(req, res) {
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
	if (value.state == BetState.ACTIVE && value.participants.has(username)) {
	    active_list.push(value.name);
	}
	else if (value.state == BetState.EXPIRED && value.participants.has(username)) {
	    expired_list.push(value.name);
	}
	else if (value.participants.has(username)) {
	    settled_list.push(value.name);
	}
    });
    res.render('home', {'welcome_msg': 'Welcome ' + username + '!', 
        'alert': '', 
        'active': active_list, 
        'expired': expired_list, 
        'settled': settled_list});
    return;
};

exports.home_bet_get = function(req, res) {
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

    var bet = BETS.get(req.params.bet_id);
    if (!bet) {
	res.render('home', {'welcome_msg': 'Welcome ' + username + '!', 'alert': 'Bet not found!', 'active': active_list, 'expired': expired_list, 'settled': settled_list});
	return;
    }

    if (bet.host == username) {
	var is_host = true;
    }
    else {
	var is_host = false;
    }

    var betState = bet.state;
    if (betState == BetState.ACTIVE || betState == BetState.EXPIRED) {
	res.render('bet_main', {'welcome_msg': 'Welcome ' + username + '!', 
	    'state': betState.key.toUpperCase(),
	    'alert': '', 
	    'active': active_list, 
	    'expired': expired_list, 
	    'settled': settled_list, 
	    'bet_is_host': is_host});
    }
    else {
	var settlementPrice = bet.settlementPrice;
	var result = bet.settle(settlementPrice);
	var pnl = result.msg.get(username);
	if (!pnl)
	    pnl = 0.0;

	res.render('bet_main', {'welcome_msg': 'Welcome ' + username + '!', 
	    'state': betState.key.toUpperCase(),
	    'settle_value': settlementPrice,
	    'pnl': pnl,
	    'alert': '', 
	    'active': active_list, 
	    'expired': expired_list, 
	    'settled': settled_list, 
	    'bet_is_host': is_host});
    }
    return;
}

