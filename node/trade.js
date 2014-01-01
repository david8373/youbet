var uuid = require('node-uuid');

function Trade(bet, bidOrder, offerOrder, price, size) {
    this.bet = bet;
    this.bidOrder = bidOrder;
    this.offerOrder = offerOrder;
    this.price = price;
    this.size = size;
    this.id = uuid.v1();
    this.tradeTime = Date();
}

module.exports = Trade;
