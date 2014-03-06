var sets = require('simplesets');
var map = require('hashmap');
var async = require('async');

var Bet = require('./bet.js');
var Order = require('./order.js');
var Trade = require('./trade.js');
var Enums = require('./enums.js');
var Socket = require('./socket.js');

var BetState = Enums.BetState;
var OrderState = Enums.OrderState;
var TradeState = Enums.TradeState;
var HashMap = map.HashMap;
var Set = sets.Set;

var moment = require('moment');
moment().format();

exports.load_all = function() {
    async.series([load_bets, load_orders, load_trades, schedule_expiry, load_complete]);
}

var load_bets = function(callback) {
    var a = 1;
    POSTGRES_CLIENT.query('SELECT DISTINCT ON (name) * FROM bets ORDER BY name, id DESC;', function(err, result) {
	if (err) {
	    console.log('Error when loading bets from DB: ' + err);
	    callback();
	}
	var bets = new HashMap();
	for (ind in result.rows) {
	    var row = result.rows[ind];
	    var participants = row.participants.split(',');
	    var bet = new Bet(row.name, row.description, row.host, row.expiry, row.min_val, row.max_val, row.tick_size, false);
	    bet.initTime = row.time;
	    bet.participants = new Set(participants);
	    bet.state = BetState.get(row.state);
	    bet.settlementPrice = row.settle_value;
	    bets.set(row.name, bet);
	}

	BETS = bets;
	console.log('bets loaded');
	callback();
    });
}

var load_orders = function(callback) {
    POSTGRES_CLIENT.query('SELECT DISTINCT ON (uid) * FROM orders ORDER BY uid, id DESC;', function(err, result) {
	if (err) {
	    console.log('Error when loading orders from DB: ' + err);
	    callback();
	}
	for (ind in result.rows) {
	    var row = result.rows[ind];
	    var order = new Order(BETS.get(row.bet_name), row.username, row.is_bid, row.price, row.size, false);
	    order.remainingSize = row.remaining_size;
	    order.state = OrderState.get(row.state);
	    order.id = row.uid;
	    order.createTime = row.time;
	    if (!order.isTerminal()) {
		if (order.isBid) {
		    BETS.get(row.bet_name).bidOrders.push(order);
		}
		else {
		    BETS.get(row.bet_name).offerOrders.push(order);
		}
	    }
	}
	callback();
    });
}

var load_trades = function(callback) {
    POSTGRES_CLIENT.query('SELECT * FROM trades ORDER BY id DESC;', function(err, result) {
	if (err) {
	    console.log('Error when loading trades from DB: ' + err);
	    callback();
	}
	for (ind in result.rows) {
	    var row = result.rows[ind];
	    var trade = new Trade(BETS.get(row.bet_name), row.long_user, row.short_user, row.price, row.size, false);
	    trade.id = row.uid;
	    trade.tradeTime = row.time;
	    BETS.get(row.bet_name).trades.push(trade);
	}
	callback();
    });
}

var schedule_expiry = function(callback) {
    BETS.forEach(function(bet, betname) {
	if (bet.state == BetState.ACTIVE) {
	    if (moment(bet.expiry) - moment() <= 0) {
		Socket.expire(betname);
	    }
	    else {
		setTimeout(function() { Socket.expire(betname); }, moment(bet.expiry) - moment());
	    }
	}
    });
    callback();
}

var load_complete = function() {
    // Enable save after loaded from DB
    BETS.forEach(function(value, key) {
	value.sortBidOrders();
	value.sortOfferOrders();
	value.calc_depth();
	value.doSave = true;
	value.bidOrders.forEach(function(order) { order.doSave = true; });
	value.offerOrders.forEach(function(order) { order.doSave = true; });
	value.trades.forEach(function(trade) { trade.doSave = true; });
    });
}

