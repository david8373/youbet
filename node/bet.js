var sets = require('simplesets');

var Order = require('./order.js');
var Enums = require('./enums.js');
var Trade = require('./trade.js');
var Consts = require('./consts.js');

var ExecState = Enums.ExecState;
var OrderState = Enums.OrderState;
var EPSILON = Consts.EPSILON;


// Constructor
function Bet(name, description, host, minVal, maxVal, tickSize) {
    this.name = name;
    this.description = description;
    this.host = host;
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.tickSize = tickSize;
    this.init();
}

Bet.prototype.init = function() {
    this.participants = new sets.Set([this.host]);
    this.bidOrders = [];
    this.offerOrders = [];
};

Bet.prototype.getParticipants = function() {
    return this.participants.array();
}

Bet.prototype.getBidOrders = function() {
    return this.bidOrders;
}

Bet.prototype.getOfferOrders = function() {
    return this.offerOrders;
}

Bet.prototype.addParticipant = function(participant) {
    if (this.participants.has(participant)) {
	console.warn("Participant " + participant + " already in the list!!");
    }
    else {
	this.participants.add(participant);
    }
};

Bet.prototype.submit = function(participant, isBid, price, size) {
    if (!this.participants.has(participant))
	var msg = "You (" + participant + ") are not invited to this bet. please contact " + this.host + " to include you";

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
    return {state: ExecState.ACCEPTED, msg: trades}
};

Bet.prototype.cancel = function(id) {
};

Bet.prototype.settle = function() {
};

// Internal implementation functions
Bet.prototype.cross = function() {
    var numBids = this.bidOrders.length;
    var numOffers = this.offerOrders.length;
    if (numBids == 0 || numOffers == 0)
	return [];

    var trades = [];
    var bidInd = 0;
    var offerInd = 0;
    while (bidInd < numBids && offerInd < numOffers) {
	var bidOrder = this.bidOrders[bidInd];
	var offerOrder = this.offerOrders[offerInd];
        if (bidOrder.price < offerOrder.price)
	    break;
	var crossPrice = (bidOrder.price + offerOrder.price) / 2.0;
	var crossSize = Math.min(bidOrder.remainingSize, offerOrder.remainingSize);
	console.log("Crossing size: " + crossSize);
	if (crossSize > 0) {
	    var newTrade = new Trade(this, bidOrder, offerOrder, crossPrice, crossSize);
	    trades.push(newTrade);

	    bidOrder.remainingSize -= crossSize;
	    offerOrder.remainingSize -= crossSize;

	    if (bidOrder.remainingSize == 0) {
	        bidOrder.state = OrderState.FILLED;
	        bidInd ++;
	    }
	    else {
		bidOrder.state = OrderState.PARTIALLYFILLED;
	    }

	    if (offerOrder.remainingSize == 0) {
	        offerOrder.state = OrderState.FILLED;
	        offerInd ++;
	    }
	    else {
		offerOrder.state = OrderState.PARTIALLYFILLED;
	    }
	}
    }
    this.removeTerminalOrders();
    return trades;
};

Bet.prototype.removeTerminalOrders = function() {
    this.bidOrders = this.bidOrders.filter(function(order) {return !order.isTerminal();} );
    this.offerOrders = this.offerOrders.filter(function(order) {return !order.isTerminal();} );
};


module.exports = Bet;


