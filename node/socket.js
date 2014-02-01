var Enums = require('./enums.js');
var Security = require('./security.js');

var BetState = Enums.BetState;
var ExecState = Enums.ExecState;

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
	    socket.emit('BET_UPDATE_PARTICIPANTS', bet.jsonParticipantUpdateMsg());
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

    socket.on('BET_NEWORDER', function(un, betname, verb, price, size) {
	console.log("socket BET_NEWORDER username=" + un + 
	    ", betname=" + betname + 
	    ", verb=" + verb + 
	    ", price=" + price +
	    ", size=" + size);
	var username = Security.check_secure_username(un);
	if (!username) {
	    console.warn("Username in cookies does not match (could have been changed manually at client side).");
	    return;
	}
	if (!socket.username == username) {
	    console.warn("Username on new order request does not match username on this socket - this should never happen!");
	    return;
	}
	var bet = BETS.get(betname);
	var isBid;
	if (verb == 'Bid') {
	    isBid = true;
	}
	else {
	    isBid = false;
	}
	if (bet) {
	    var result = bet.submit(username, isBid, parseFloat(price), parseFloat(size));
	    console.log('result:');
	    console.log(result);
	    var response = {};
	    if (result.state == ExecState.ACCEPTED) {
		response.success = true;
		response.err = '';
		socket.emit('BET_NEWORDER_RESPONSE', response);
		IO.sockets.in(betname).emit('BET_UPDATE_DEPTH', bet.jsonDepthUpdateMsg());

		// Even when no trades recorded, wash-trades (self-crossing) could have reduced order remaining size
		var socketsInRoom = IO.sockets.clients(betname);
		for (i in socketsInRoom) {
		    console.log("Emitting order info for " + socketsInRoom[i].username);
		    socketsInRoom[i].emit('BET_UPDATE_ORDER', bet.jsonOrderUpdateMsg(socketsInRoom[i].username));
		}

		// Update trades only when there are trades
		if (result.msg.length > 0) {
		    var socketsInRoom = IO.sockets.clients(betname);
		    for (i in socketsInRoom) {
			console.log("Emitting order info for " + socketsInRoom[i].username);
			socketsInRoom[i].emit('BET_UPDATE_ORDER', bet.jsonOrderUpdateMsg(socketsInRoom[i].username));
			console.log("Emitting trade info for " + socketsInRoom[i].username);
			socketsInRoom[i].emit('BET_UPDATE_TRADE', bet.jsonTradeUpdateMsg(socketsInRoom[i].username));
		    }
		}
	    }
	    else {
		response.success = false;
		response.err = result.msg;
		socket.emit('BET_NEWORDER_RESPONSE', response);
	    }
	}
    });

    socket.on('BET_INVITE', function(un, betname, invite) {
	console.log("socket BET_INVITE username=" + un + 
	    ", betname=" + betname + 
	    ", invite=" + invite);
	var username = Security.check_secure_username(un);
	if (!username) {
	    console.warn("Username in cookies does not match (could have been changed manually at client side).");
	    return;
	}
	if (!socket.username == username) {
	    console.warn("Username on new order request does not match username on this socket - this should never happen!");
	    return;
	}
	if (/,/.test(invite)) {
	    socket.emit('BET_INVITE_RESPONSE', {'success': false, 
		'msg': 'One person at a time please (no comma-deliminated list)'});
	    return;
	}

	var bet = BETS.get(betname);
	if (bet) {
	    var result = bet.addParticipant(invite);
	    console.log(result);
	    if (result.success) {
		socket.emit('BET_INVITE_RESPONSE', {'success': true, 'msg': result.msg});
		var socketsInRoom = IO.sockets.clients(betname);
		for (i in socketsInRoom) {
		    console.log("Updating participants list for " + socketsInRoom[i].username);
		    socketsInRoom[i].emit('BET_UPDATE_PARTICIPANTS', bet.jsonParticipantUpdateMsg());
		}
	    }
	    else {
		socket.emit('BET_INVITE_RESPONSE', {'success': false, 'msg': result.msg});
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

