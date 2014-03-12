var Consts = require('../node/consts.js');
var Security = require('../node/security.js');
var Enums = require('../node/enums.js');
var Bet = require('../node/bet.js');
var Socket = require('../node/socket.js');

var BetState = Enums.BetState;
var BETNAME_RE = Consts.BETNAME_RE;

var moment = require('moment');
moment().format();

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
    var render_msg = getBetList(username);
    render_msg['welcome_msg'] = 'Welcome ' + username + '!';
    render_msg['error'] = '';
    res.render('new_bet', render_msg);
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

    var betname = req.body.betname;
    var description = req.body.description;
    var minval = req.body.minval;
    var maxval = req.body.maxval;
    var ticksize = req.body.ticksize;
    var expiry = req.body.expiry;
    var tzOffset = req.body.clientTzOffset;
    console.log("Timezone Offset = " + tzOffset);

    console.log('betname = ' + betname);
    console.log('description = ' + description);
    console.log('minval = ' + minval);
    console.log('maxval = ' + maxval);
    console.log('ticksize = ' + ticksize);
    var dateStr = moment(expiry).add('minutes', tzOffset).toISOString();
    expiry = new Date(dateStr);
    console.log('expiry = ' + expiry);

    if (!betname || !description || !minval || !maxval || !ticksize || !expiry) {
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
    else if (BETS.get(betname)) {
	var error = 'Bet with same name already exists';
    }
    else if (moment(expiry) - moment() <= 0) {
	var error = 'Expiry cannot be in the past';
    }

    if (error) {
	res.status(403);
        var render_msg = getBetList();
        render_msg['welcome_msg'] = 'Welcome ' + username + '!';
        render_msg['error'] = error;
        res.render('new_bet', render_msg);
	return;
    }

    console.log("Creating the bet");
    var bet = new Bet(betname, description, username, expiry, minval, maxval, ticksize, true);
    // TODO: properly fix scheduling for long-expiry bets
    if (moment(expiry) - moment() < moment.duration(1, 'weeks')) {
        setTimeout(function() { Socket.expire(betname); }, moment(expiry) - moment());
    }

    console.log("Redirecting to /home/" + betname);
    BETS.set(betname, bet);
    res.redirect('/home/' + betname);
};

var getBetList = function(username) {
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
    return {'active': active_list, 'expired': expired_list, 'settled': settled_list};
}
