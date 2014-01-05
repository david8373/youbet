var uuid = require('node-uuid');

var Enums = require('./enums.js');
var OrderState = Enums.OrderState;

function Order(bet, participant, isBid, price, size) {
    this.bet = bet;
    this.participant = participant;
    this.isBid = isBid;
    this.price = price;
    this.totalSize = size;
    this.remainingSize = size;
    this.state = OrderState.ACTIVE;
    this.id = uuid.v1();
    this.createTime = Date();

    // TODO: DB write
}

Order.prototype.isTerminal = function() {
    return this.state == OrderState.FILLED || this.state == OrderState.CANCELLED || this.state == OrderState.EXPIRED;
};

Order.prototype.cancel = function() {
    this.state = OrderState.CANCELLED;
    // TODO: DB write
}

Order.prototype.expire = function() {
    this.state = OrderState.EXPIRED;
    // TODO: DB write
}

Order.prototype.fill = function(amount) {
    if (amount <= 0) {
	console.warn("Trying to fill an order with non-positive amount!");
	return;
    }

    if (amount < this.remainingSize) {
	this.state = OrderState.PARTIALLYFILLED;
    }
    else {
	this.state = OrderState.FILLED;
	if (amount > this.remainingSize) {
	console.warn("Trying to fill an order with more than its remaining size!");
	}
    }
    this.remainingSize -= amount;
    return;
}
 
function PriceTimeAscending(o1, o2) {
    if (o1.price == o2.price)
	return o1.createTime - o2.createTime;
    return o1.price - o2.price;
}

function PriceTimeDescending(o1, o2) {
    if (o1.price == o2.price)
	return o1.createTime - o2.createTime;
    return o2.price - o1.price;
}

module.exports = Order;
module.exports.PriceTimeAscending = PriceTimeAscending;
module.exports.PriceTimedescending = PriceTimeDescending;
