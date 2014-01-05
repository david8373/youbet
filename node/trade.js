var uuid = require('node-uuid');

function Trade(bet, bidOrder, offerOrder, price, size) {
    this.bet = bet;
    this.bidOrder = bidOrder;
    this.offerOrder = offerOrder;
    this.price = price;
    this.size = size;
    this.id = uuid.v1();
    this.tradeTime = Date();
    // TODO: DB save
}

Trade.prototype.settle = function(settlementPrice) {
    // Positive if long party made money
    return (settlementPrice - this.price) * this.size;
};

module.exports = Trade;
