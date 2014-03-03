var sets = require('simplesets');
var map = require('hashmap');

var Order = require('./order.js');
var Enums = require('./enums.js');
var Trade = require('./trade.js');
var Consts = require('./consts.js');

var ExecState = Enums.ExecState;
var OrderState = Enums.OrderState;
var BetState = Enums.BetState;
var EPSILON = Consts.EPSILON;
var DEPTH_LEVELS = Consts.DEPTH_LEVELS;

var HashMap = map.HashMap;
var Set = sets.Set;

var moment = require('moment');
moment().format();

// Constructor
function Bet(name, description, host, expiry, minVal, maxVal, tickSize, doSave) {
    this.name = name;
    this.description = description;
    this.host = host;
    this.initTime = new Date();
    this.expiry = expiry;
    this.state = BetState.ACTIVE;
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.tickSize = tickSize;
    this.doSave = doSave;
    this.init();
    this.calc_depth();
    this.save();
}

Bet.prototype.save = function() {
    if (this.doSave) {
	var participants_str = this.participants.array().join(',');
	var state_str = this.state.key.toUpperCase();
	POSTGRES_CLIENT.query({text: 'INSERT INTO bets(name,time,description,participants,state,expiry,min_val,max_val,tick_size,settle_value,host) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', values: [this.name, this.initTime, this.description, participants_str, state_str, this.expiry, this.minVal, this.maxVal, this.tickSize, this.settlementPrice, this.host]}, function(err, result) {
	    if (err) {
		console.log('Error when saving bet update: ' + err);
		return;
	    }
	});
    }
}

Bet.prototype.init = function() {
    this.participants = new Set([this.host]);
    this.trades = [];
    this.bidOrders = [];
    this.offerOrders = [];
    this.settlementPrice = 0.0;
};

Bet.prototype.getParticipants = function() {
    return this.participants.array();
};

Bet.prototype.getBidOrders = function() {
    return this.bidOrders;
};

Bet.prototype.getOfferOrders = function() {
    return this.offerOrders;
};

Bet.prototype.addParticipant = function(participant) {
    if (this.participants.has(participant)) {
	var msg = "Participant " + participant + " already participating";
	console.warn(msg);
	return {'success': false, 'msg': msg};
    }
    else {
	this.participants.add(participant);
	this.save();
	return {'success': true, 'msg': "Participant " + participant + " successfully added"};
    }
};

Bet.prototype.calc_depth = function() {
    this.bp = [];
    this.bs = [];
    this.ap = [];
    this.as = [];
    var acc = 0;
    var p = this.maxVal + 1.0;
    for (ind  in this.bidOrders) {	
	var bidOrder = this.bidOrders[ind];
	if (bidOrder.price < p) {
	    if (p < this.maxVal) {
		this.bp.push(p);
		this.bs.push(acc);
	    }
	    p = bidOrder.price;
	    acc = bidOrder.remainingSize;
	}
	else {
	    acc += bidOrder.remainingSize;
	}
    }
    if (acc > 0) {
	this.bp.push(p);
	this.bs.push(acc);
    }

    acc = 0;
    p = this.minVal - 1.0;
    for (ind  in this.offerOrders) {
	var offerOrder = this.offerOrders[ind];
	if (offerOrder.price > p) {
	    if (p > this.minVal) {
		this.ap.push(p);
		this.as.push(acc);
	    }
	    p = offerOrder.price;
	    acc = offerOrder.remainingSize;
	}
	else {
	    acc += offerOrder.remainingSize;
	}
    }
    if (acc > 0) {
	this.ap.push(p);
	this.as.push(acc);
    }
};

var PriceTimeAscending = function(o1, o2) {
    if (o1.price == o2.price)
	return o1.createTime - o2.createTime;
    return o1.price - o2.price;
}

var PriceTimeDescending = function(o1, o2) {
    if (o1.price == o2.price)
	return o1.createTime - o2.createTime;
    return o2.price - o1.price;
}

Bet.prototype.submit = function(participant, isBid, price, size) {
    console.log('Submitting participant=' + participant
	    + isBid?', bid ':', ask ' + size + ' @' + price);
    if (!this.participants.has(participant))
	var msg = "You (" + participant + ") are not invited to this bet. please contact " + this.host + " to include you";
    else if (this.state != BetState.ACTIVE)
	var msg = "Bet state is " + this.state + " and no more orders allowed";
    else if (!price || isNaN(price))
	var msg = "Price must be a numeric value";
    else if (!size || isNaN(size))
	var msg = "Size must be a numeric value";
    else if (price < this.minVal)
	var msg = price + " is below minimum price (" + this.minVal + ") of this bet";
    else if (price > this.maxVal)
	var msg = price + " is above maximum price (" + this.maxVal + ") of this bet";
    else if (Math.abs(Math.round(price / this.tickSize) * this.tickSize - price) > EPSILON)
	var msg = price + " does not follow minimum tick size of " + this.tickSize;
    else if (size <= 0)
	var msg = "Order size (" + size + ") should be positive";

    if (msg) {
	console.warn("Order submissing error: " + msg);
	return {state: ExecState.REJECTED, msg: msg};
    }

    var sizeRounded = Math.round(size);
    var orders = isBid?this.bidOrders:this.offerOrders;
    var newOrder = new Order(this, participant, isBid, price, sizeRounded, true);
    orders.push(newOrder);
    if (isBid) {
	this.sortBidOrders();
    }
    else { 
	this.sortOfferOrders();
    }
    var trades = this.cross();
    this.calc_depth();
    this.save();
    return {state: ExecState.ACCEPTED, msg: trades};
};

Bet.prototype.sortBidOrders = function() {
    this.bidOrders.sort(PriceTimeDescending);
};

Bet.prototype.sortOfferOrders = function() {
    this.offerOrders.sort(PriceTimeAscending);
};

Bet.prototype.cancel = function(idToCancel) {
    var msg = '';
    var success = false;
    var numFound = 0;

    for (ind in this.bidOrders) {
	var bidOrder = this.bidOrders[ind];
	if (bidOrder.id == idToCancel) {
	    numFound ++;
	    bidOrder.cancel();
	}
    }

    for (ind in this.offerOrders) {
	var offerOrder = this.offerOrders[ind];
	if (offerOrder.id == idToCancel) {
	    numFound ++;
	    offerOrder.cancel();
	}
    }
    this.removeTerminalOrders();

    if (numFound == 0)
	msg = "Error cancelling: order cannot be found";
    else if (numFound > 1)
	msg = "Warning cancelling: more than one order found"; // This should never happen
    else {
	msg = "Successfully cancelled order " + idToCancel;
	success = true;
    }

    this.calc_depth();
    this.save();

    return {'success': success, 'msg': msg};
};

Bet.prototype.expire = function() {
    if (this.state != BetState.ACTIVE) {
	console.warn("Bet state is already " + this.state + " and cannot be further expired");
	return;
    }
    this.bidOrders.forEach(function(order) { order.expire(); });
    this.offerOrders.forEach(function(order) { order.expire(); });
    this.removeTerminalOrders();
    this.state = BetState.EXPIRED;
    this.calc_depth();
    this.save();
    return;
};

Bet.prototype.settle = function(settlementPrice) {
    if (!settlementPrice || isNaN(settlementPrice))
	var msg = "Settlement price must be a numeric value";
    if (this.state == BetState.ACTIVE) {
	var msg = "Bet state is still ACTIVE and cannot be settled";
    }
    if (settlementPrice < this.minVal) {
	var msg = 'Settlement price ' + settlementPrice + ' cannot be below minimum value of ' + this.minVal;
    }
    if (settlementPrice > this.maxVal) {
	var msg = 'Settlement price ' + settlementPrice + ' cannot be above maximum value of ' + this.maxVal;
    }

    if (msg) {
	console.warn("Bet settlement error: " + msg);
	return {state: ExecState.REJECTED, msg: msg};
    }

    this.settlementPrice = settlementPrice;
    var result = new HashMap();
    this.participants.each(function(participant) { result.set(participant, 0.0); });
    for (ind in this.trades) {
	var trade = this.trades[ind];
	var res = trade.settle(settlementPrice);
	var tmp = result.get(trade.longParty);
	result.set(trade.longParty, tmp + res);
	tmp = result.get(trade.shortParty);
	result.set(trade.shortParty, tmp - res);
    }
    this.state = BetState.SETTLED;
    this.save();
    return {state: ExecState.ACCEPTED, msg: result};
};

// Internal implementation functions
Bet.prototype.cross = function() {
    var numBids = this.bidOrders.length;
    var numOffers = this.offerOrders.length;
    if (numBids == 0 || numOffers == 0)
	return [];

    var tradesThisTime = [];
    var bidInd = 0;
    var offerInd = 0;
    while (bidInd < numBids && offerInd < numOffers) {
	var bidOrder = this.bidOrders[bidInd];
	var offerOrder = this.offerOrders[offerInd];
	var bidPrice = parseFloat(bidOrder.price);
	var offerPrice = parseFloat(offerOrder.price);
	if (bidPrice < offerPrice)
	    break;
	var crossPrice = (bidPrice + offerPrice) / 2;
	var crossSize = Math.min(bidOrder.remainingSize, offerOrder.remainingSize);
	if (crossSize > 0) {
	    if (bidOrder.participant != offerOrder.participant) { // no wash trades allowed
	        var newTrade = new Trade(this, bidOrder.participant, offerOrder.participant, crossPrice, crossSize, true);
	        this.trades.push(newTrade);
	        tradesThisTime.push(newTrade);
	    }

	    bidOrder.fill(crossSize);
	    offerOrder.fill(crossSize);

	    if (bidOrder.state == OrderState.FILLED)  {
		bidInd ++;
	    }
	    if (offerOrder.state == OrderState.FILLED)  {
		offerInd ++;
	    }
	}
    }
    this.removeTerminalOrders();
    return tradesThisTime;
};

Bet.prototype.removeTerminalOrders = function() {
    this.bidOrders = this.bidOrders.filter(function(order) {return !order.isTerminal();} );
    this.offerOrders = this.offerOrders.filter(function(order) {return !order.isTerminal();} );
};

Bet.prototype.jsonStaticUpdateMsg = function() {
    if (moment(this.expiry) <= moment()) {
	var expiryMsg = 'Expired ' + moment(this.expiry).fromNow();
    }
    else {
	var expiryMsg = 'Expires ' + moment(this.expiry).fromNow();
    }
    return {'name': this.name,
	'expiry': expiryMsg,
	'state': this.state.key,
	'description': this.description,
	'minVal': this.minVal,
	'maxVal': this.maxVal,
	'tickSize': this.tickSize};
};

Bet.prototype.jsonParticipantUpdateMsg = function() {
    return {'name': this.name,
	    'participants': this.participants.array()};
};

Bet.prototype.jsonDepthUpdateMsg = function() {
    var depth = [];
    for (var i = 0; i < Math.min(this.bp.length, DEPTH_LEVELS); ++i) {
	depth.push([this.bp[i], this.bs[i]]);
    }
    for (var i = 0; i < Math.min(this.ap.length, DEPTH_LEVELS); ++i) {
	depth.push([this.ap[i], -1 * this.as[i]]);
    }
    return {'name': this.name,
	    'depth': depth};
};

Bet.prototype.jsonOrderUpdateMsg = function(username) {
    var orders = [];
    for (var i in this.bidOrders) {
	if (this.bidOrders[i].participant == username) {
	    orders.push({'side': 'Bid', 
		'price': this.bidOrders[i].price, 
		'totalSize': this.bidOrders[i].totalSize,
		'remainingSize': this.bidOrders[i].remainingSize,
		'uuid': this.bidOrders[i].id});
	}
    }
    for (var i in this.offerOrders) {
	if (this.offerOrders[i].participant == username) {
	    orders.push({'side': 'Ask', 
		'price': this.offerOrders[i].price, 
		'totalSize': this.offerOrders[i].totalSize,
		'remainingSize': this.offerOrders[i].remainingSize,
		'uuid': this.offerOrders[i].id});
	}
    }
    return {'name': this.name,
	    'orders': orders};
};

Bet.prototype.jsonTradeUpdateMsg = function(username) {
    var trades = [];
    for (var i in this.trades) {
	if (this.trades[i].longParty == username) {
	    trades.push({'side': 'Long', 
		'price': this.trades[i].price, 
		'size': this.trades[i].size,
		'uuid': this.trades[i].id});
	}
	else if (this.trades[i].shortParty = username) {
	    trades.push({'side': 'Short', 
		'price': this.trades[i].price, 
		'size': this.trades[i].size,
		'uuid': this.trades[i].id});
	}
    }
    return {'name': this.name,
	    'trades': trades};
};

Bet.prototype.jsonTradeSettledUpdateMsg = function(username) {
    var trades = [];
    for (var i in this.trades) {
	if (this.trades[i].longParty == username) {
	    trades.push({'side': 'Long', 
		'price': this.trades[i].price, 
		'size': this.trades[i].size,
		'uuid': this.trades[i].id,
	        'pnl': this.trades[i].settle(this.settlementPrice)});
	}
	else if (this.trades[i].shortParty = username) {
	    trades.push({'side': 'Short', 
		'price': this.trades[i].price, 
		'size': this.trades[i].size,
		'uuid': this.trades[i].id,
	        'pnl': this.trades[i].settle(-1.0 * this.settlementPrice)});
	}
    }
    return {'name': this.name,
	    'settlementPrice': this.settlementPrice,
	    'trades': trades};
}

Bet.prototype.jsonSettlementUpdateMsg = function(username) {
    var pnl = [];
    this.doSave = false;
    var result = this.settle(this.settlementPrice);
    this.doSave = true;
    return {'name': this.name,
	    'settlementPrice': this.settlementPrice,
	    'pnl': result.msg.get(username)};
}

module.exports = Bet;


