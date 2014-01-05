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


// Constructor
function Bet(name, description, host, minVal, maxVal, tickSize) {
    this.name = name;
    this.description = description;
    this.host = host;
    this.state = BetState.ACTIVE;
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.tickSize = tickSize;
    this.init();
    // TODO: update DB
}

Bet.prototype.init = function() {
    this.participants = new sets.Set([this.host]);
    this.trades = [];
    this.bidOrders = [];
    this.offerOrders = [];
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
	console.warn("Participant " + participant + " already in the list!!");
    }
    else {
	this.participants.add(participant);
	// TODO: update DB
    }
};

Bet.prototype.submit = function(participant, isBid, price, size) {
    if (!this.participants.has(participant))
	var msg = "You (" + participant + ") are not invited to this bet. please contact " + this.host + " to include you";

    if (this.state != BetState.ACTIVE)
	var msg = "Bet state is " + this.state + " and no more orders allowed";

    if (price < this.minVal)
	var msg = price + " is below minimum price (" + this.minVal + ") of this bet";

    if (price > this.maxVal)
	var msg = price + " is above maximum price (" + this.maxVal + ") of this bet";

    if ((Math.abs(Math.round(price / this.tickSize) * this.tickSize) - price) > EPSILON)
	var msg = price + " does not follow minimum tick size of " + this.tickSize;

    if (size <= 0)
	var msg = "Order size (" + size + ") should be positive";

    if (msg) {
	console.warn("Order submissing error: " + msg);
	return {state: ExecState.REJECTED, msg: msg};
    }

    var sizeRounded = Math.round(size);
    var orders = isBid?this.bidOrders:this.offerOrders;
    var newOrder = new Order(this, participant, isBid, price, sizeRounded);
    orders.push(newOrder);
    if (isBid)
	orders.sort(Order.PriceTimeDescending);
    else
	orders.sort(Order.PriceTimeAscending);
    var trades = this.cross();
    return {state: ExecState.ACCEPTED, msg: trades};
};

Bet.prototype.cancel = function(idToCancel) {
    var msg = "";
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
    else
	msg = "Successfully cancelled order " + idToCancel;

    return {success: true, msg: msg};
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
    // TODO: DB save
    return;
};

Bet.prototype.settle = function(settlementPrice) {
    if (this.state == BetState.ACTIVE) {
	console.warn("Bet state is still ACTIVE and cannot be settled");
	return;
    }
    if (this.state == BetState.SETTLED) {
	console.warn("Bet state is already SETTLED and cannot be further settled");
	return;
    }

    var result = new map.HashMap();
    this.participants.each(function(participant) { result.set(participant, 0.0); });
    for (ind in this.trades) {
	var trade = this.trades[ind];
	var res = trade.settle(settlementPrice);
	var tmp = result.get(trade.bidOrder.participant);
	result.set(trade.bidOrder.participant, tmp + res);
	tmp = result.get(trade.offerOrder.participant);
	result.set(trade.offerOrder.participant, tmp - res);
    }
    this.state = BetState.SETTLED;
    // TODO: DB save
    return result;
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
        if (bidOrder.price < offerOrder.price)
	    break;
	var crossPrice = (bidOrder.price + offerOrder.price) / 2.0;
	var crossSize = Math.min(bidOrder.remainingSize, offerOrder.remainingSize);
	if (crossSize > 0) {
	    var newTrade = new Trade(this, bidOrder, offerOrder, crossPrice, crossSize);
	    this.trades.push(newTrade);
	    tradesThisTime.push(newTrade);

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


module.exports = Bet;


