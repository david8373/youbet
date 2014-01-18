var uuid = require('node-uuid');

var Enums = require('./enums.js');
var OrderState = Enums.OrderState;

function Order(bet, participant, isBid, price, size, doSave) {
    this.bet = bet;
    this.participant = participant;
    this.isBid = isBid;
    this.price = price;
    this.totalSize = size;
    this.remainingSize = size;
    this.state = OrderState.ACTIVE;
    this.id = uuid.v1();
    this.createTime = new Date();
    this.doSave = doSave;

    this.save();
}

Order.prototype.save = function() {
    if (this.doSave) {
	var state_str = this.state.key.toUpperCase();
	POSTGRES_CLIENT.query({text: 'INSERT INTO orders VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', values: [this.bet.name, this.participant, this.isBid, this.price, state_str, this.totalSize, this.remainingSize, this.id, this.createTime]}, function(err, result) {
	    if (err) {
		console.log('Error when saving order update: ' + err);
		return;
	    }
	});
    }
}

Order.prototype.isTerminal = function() {
    return this.state == OrderState.FILLED || this.state == OrderState.CANCELLED || this.state == OrderState.EXPIRED;
};

Order.prototype.cancel = function() {
    this.state = OrderState.CANCELLED;
    this.save();
}

Order.prototype.expire = function() {
    this.state = OrderState.EXPIRED;
    this.save();
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
    this.save();
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
