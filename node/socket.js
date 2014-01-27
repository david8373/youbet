var Enums = require('./enums.js');
var Security = require('./security.js');

var BetState = Enums.BetState;

exports.server = function(socket) {
    socket.on('BET_SUBSCRIBE', function(un, betname) {
	console.log("socket BET_SUBSCRIBE: username=" + un + ", betname=" + betname);
	var username = Security.check_secure_username(un);
	if (!username) {
	    console.warn("Username in cookies does not match (could have been changed manually at client side).");
	    return;
	}
	socket.username = username;
	var bet = BETS.get(betname);
	if (BETS.get(betname)) {
	    if (socket.room) {
		socket.leave(socket.room);
	    }
	    socket.room = betname;
	    console.log("Joining room " + betname);
	    socket.join(betname);
	    socket.emit('BET_UPDATE_STATIC', bet.jsonStaticUpdateMsg());
	    socket.emit('BET_UPDATE_DEPTH', bet.jsonDepthUpdateMsg());
	    socket.emit('BET_UPDATE_ORDER', bet.jsonOrderUpdateMsg(username));
	    socket.emit('BET_UPDATE_TRADE', bet.jsonTradeUpdateMsg(username));
	}
    });

    socket.on('BET_CANCEL', function(un, betname, uuid) {
	console.log("socket BET_CANCEL username=" + un + ", betname=" + betname + ", uuid=" + uuid);
	var username = Security.check_secure_username(un);
	if (!username) {
	    console.warn("Username in cookies does not match (could have been changed manually at client side).");
	    return;
	}
	if (!socket.username == username) {
	    console.warn("Username on cancel request does not match username on this socket - this should never happen!");
	    return;
	}
	var bet = BETS.get(betname);
	if (bet) {
	    var result = bet.cancel(uuid);
	    result.uuid = uuid;
	    socket.emit('BET_CANCEL_RESPONSE', result);
	    if (result.success) {
		console.log("Broadcasting depth to room " + betname);
		console.log("Current socket room = " + socket.room);
		IO.sockets.in(betname).emit('BET_UPDATE_DEPTH', bet.jsonDepthUpdateMsg());
	    }
	}
    });

    socket.on('disconnect', function() {
	console.log("Disconnecting and leaving room " + socket.room);
	if (socket.room) {
	    socket.leave(socket.room);
	}
    });
}

