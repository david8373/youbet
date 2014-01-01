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
}

Order.prototype.isTerminal = function(order) {
    return this.state == OrderState.FILLED || this.state == OrderState.CANCELLED || this.state == OrderState.EXPIRED;
};
 
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
