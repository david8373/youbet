var Bet = require('../node/bet.js');
var Enums = require('../node/enums.js');
var Consts = require('../node/consts.js');

var OrderState = Enums.OrderState;
var ExecState = Enums.ExecState;
var BetState = Enums.BetState;

var EPSILON = Consts.EPSILON;

var DbClient = require('../node/db_client.js');
DbClient.create();

exports.testParticipants = function(test){
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet0", "Yuhan's Bet 0", "Yuhan", d, 0.0, 1.0, 0.05, true);
    test.equal(1, bet.getParticipants().length, "Initial participant is just host himself");
    bet.addParticipant('Jing');
    test.equal(2, bet.getParticipants().length, "Adding another participant");
    bet.addParticipant('Jing');
    test.equal(2, bet.getParticipants().length, "Cannot add same participant twice");
    test.done();
};

exports.testPrice = function(test) {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet1", "Yuhan's Bet 1", "Yuhan", d, 0.0, 1.0, 0.05, true);
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
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet2", "Yuhan's Bet 2", "Yuhan", d, 0.0, 1.0, 0.05, true);
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
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet3", "Yuhan's Bet3", "Yuhan", d, 0.0, 1.0, 0.05, true);
    bet.addParticipant('Jing');
    bet.addParticipant('SomeOtherGuy');

    bet.submit('Yuhan', true, 0.2, 1);
    bet.submit('SomeOtherGuy', true, 0.2, 1);
    var response = bet.submit('Jing', false, 0.2, 1);
    test.equal(ExecState.ACCEPTED, response.state, "Order submission successful");
    var trades = response.msg;
    test.equals(1, trades.length ,"One trade generated");
    test.equals("Yuhan", trades[0].longParty, "At same price Yuhan is done because of time priority");
    test.done();
};

exports.testCancel = function(test) {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet4", "Yuhan's Bet 4", "Yuhan", d, 0.0, 1.0, 0.05, true);
    bet.addParticipant('Jing');
    var response = bet.submit('Yuhan', true, 0.2, 1);
    var orderID = bet.bidOrders[0].id;
    var response = bet.cancel(orderID);
    test.ok(response.success, "Testing cancellation success");
    test.equals(0, bet.bidOrders.length, "Order should be gone after cancellation");
    console.log(bet.bidOrders);
    test.done();
};

exports.testExpireSettle = function(test) {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet5", "Yuhan's Bet 5", "Yuhan", d, 0.0, 1.0, 0.05, true);
    bet.addParticipant('Jing');
    bet.submit('Yuhan', true, 0.2, 5);
    var response = bet.submit('Jing', false, 0.2, 3);
    test.equals(ExecState.ACCEPTED, response.state, "One trade done");
    test.equals(1, response.msg.length, "One trade done");

    // Cannot settle active bets
    bet.settle(0.0);
    test.equals(BetState.ACTIVE, bet.state, "Active bets cannot be settled");

    // Expiration
    bet.expire();
    test.equals(BetState.EXPIRED, bet.state, "Expired bet");
    test.equals(0, bet.bidOrders.length, "All orders expired");
    test.equals(0, bet.offerOrders.length, "All orders expired");

    // Cannot submit after bet expired
    response = bet.submit('Yuhan', true, 0.5, 1);
    test.equals(ExecState.REJECTED, response.state, "Cannot submit to expired bet");

    // Settling a bet
    response = bet.settle(0.3);
    test.equals(BetState.SETTLED, bet.state, "Bet settled");
    test.ok(Math.abs(0.3 - response.get('Yuhan')) < EPSILON, "Yuhan made 0.3");
    test.ok(Math.abs(0.3 + response.get('Jing')) < EPSILON, "Jing lost 0.3");
    test.done();
};

exports.testCalcDepth = function(test) {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var bet = new Bet("YuhanBet6", "Yuhan's Bet 6", "david8373", d, 0.0, 1.0, 0.05, true);
    bet.addParticipant('Jing');

    // Bet initializes with empty depth
    test.equals(0, bet.bp.length, "Depth initializes to 0");
    test.equals(0, bet.bs.length, "Depth initializes to 0");
    test.equals(0, bet.ap.length, "Depth initializes to 0");
    test.equals(0, bet.as.length, "Depth initializes to 0");

    // Bid depth after first order
    bet.submit('david8373', true, 0.4, 5);
    test.equals(1, bet.bp.length, "First bid in depth");
    test.equals(1, bet.bs.length, "First bid in depth");
    test.equals(0.4, bet.bp[0], "First bid in depth");
    test.equals(5, bet.bs[0], "First bid in depth");

    // Bid depth after different order
    bet.submit('david8373', true, 0.3, 5);
    test.equals(2, bet.bp.length, "Second bid in depth");
    test.equals(2, bet.bs.length, "Second bid in depth");
    test.equals(0.4, bet.bp[0], "Second bid in depth");
    test.equals(5, bet.bs[0], "Second bid in depth");

    // Bid depth after different order
    bet.submit('david8373', true, 0.6, 6);
    test.equals(3, bet.bp.length, "Third bid in depth");
    test.equals(3, bet.bs.length, "Third bid in depth");
    test.equals(0.6, bet.bp[0], "Third bid in depth");
    test.equals(6, bet.bs[0], "Third bid in depth");

    // Bid depth after different order
    bet.submit('david8373', true, 0.4, 3);
    console.log(bet.bp.length);
    test.equals(3, bet.bp.length, "Fourth bid in depth");
    test.equals(3, bet.bs.length, "Fourth bid in depth");
    test.equals(0.4, bet.bp[1], "Fourth bid in depth");
    test.equals(8, bet.bs[1], "Fourth bid in depth");

    test.done();
};

POSTGRES_CLIENT.on('drain', POSTGRES_CLIENT.end.bind(POSTGRES_CLIENT));

