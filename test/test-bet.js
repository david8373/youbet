var Bet = require('../node/bet.js');
var Enums = require('../node/enums.js');

var OrderState = Enums.OrderState;
var ExecState = Enums.ExecState;

var EPSILON = 1.0e-7;

exports.testParticipants = function(test){
    var bet = new Bet("YuhanBet", "Yuhan's Bet", "Yuhan", 0.0, 1.0, 0.05);
    test.equal(1, bet.getParticipants().length, "Initial participant is just host himself");
    bet.addParticipant('Jing');
    test.equal(2, bet.getParticipants().length, "Adding another participant");
    bet.addParticipant('Jing');
    test.equal(2, bet.getParticipants().length, "Cannot add same participant twice");
    test.done();
};

exports.testPrice = function(test) {
    var bet = new Bet("YuhanBet", "Yuhan's Bet", "Yuhan", 0.0, 1.0, 0.05);
    bet.addParticipant('Jing');
    var response = bet.submit('SomeOtherGuy', true, 0.2, 1.0);
    test.equal(ExecState.REJECTED, response.state, "Orders by other participants should be rejected");
    var response = bet.submit('Yuhan', true, -0.1, 1.0);
    test.equal(ExecState.REJECTED, response.state, "Order price below minVal should be rejected");
    var response = bet.submit('Yuhan', true, 1.5, 1.0);
    test.equal(ExecState.REJECTED, response.state, "Order price above maxVal should be rejected");
    var response = bet.submit('Yuhan', true, 0.43, 1.0);
    test.equal(ExecState.REJECTED, response.state, "Order price not conforming to tick size should be rejected");
    var response = bet.submit('Yuhan', true, 0.5, -2);
    test.equal(ExecState.REJECTED, response.state, "Order size cannot be negative");
    test.done();
};

exports.testOrder = function(test) {
    var bet = new Bet("YuhanBet", "Yuhan's Bet", "Yuhan", 0.0, 1.0, 0.05);
    bet.addParticipant('Jing');

    // Initial bid
    var response = bet.submit('Yuhan', true, 0.2, 5);
    test.equal(ExecState.ACCEPTED, response.state, "Order submission successful");
    var trades = response.msg;
    test.equal(0, trades.length, "One bid does not generate trade");

    // Jing's offer crossing with Yuhan's bid
    var response = bet.submit('Jing', false, 0.2, 3);
    test.equal(ExecState.ACCEPTED, response.state, "Order submission successful");
    var trades = response.msg;
    test.equal(1, trades.length, "One trade generated");
    test.equal(1, bet.bidOrders.length, "Yuhan's order still outstanding");
    test.equal(0, bet.offerOrders.length, "Jing's order done");
    test.equal(OrderState.PARTIALLYFILLED, bet.bidOrders[0].state, "Partial fill state change");

    // Finding right mid when market crossed by a positive amount
    var response = bet.submit('Jing', false, 0.1, 1);
    test.equal(ExecState.ACCEPTED, response.state, "Order submission successful");
    var trades = response.msg;
    test.equals(1, trades.length, "One trade generated");
    test.ok(Math.abs(0.15 - trades[0].price) < EPSILON, "Using average when market crossed by a margin");

    // Sweeping multiple levels
    bet.submit('Yuhan', true, 0.15, 1);
    var response = bet.submit('Jing', false, 0.15, 3);
    test.equal(ExecState.ACCEPTED, response.state, "Order submission successful");
    var trades = response.msg;
    test.equals(2, trades.length, "Two trades generated because of orderbook sweeping");
    test.equals(0, bet.bidOrders.length, "Bid stack completely sweeped");
    test.equals(1, bet.offerOrders.length, "Offer stack has remaining orders");
    test.done();
};

exports.testPriceTimePriority = function(test) {
    var bet = new Bet("YuhanBet", "Yuhan's Bet", "Yuhan", 0.0, 1.0, 0.05);
    bet.addParticipant('Jing');
    bet.addParticipant('SomeOtherGuy');

    bet.submit('Yuhan', true, 0.2, 1);
    bet.submit('SomeOtherGuy', true, 0.2, 1);
    var response = bet.submit('Jing', false, 0.2, 1);
    test.equal(ExecState.ACCEPTED, response.state, "Order submission successful");
    var trades = response.msg;
    test.equals(1, trades.length ,"One trade generated");
    test.equals("Yuhan", trades[0].bidOrder.participant, "At same price Yuhan is done because of time priority");
    test.done();
};

