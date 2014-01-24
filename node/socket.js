var Enums = require('./enums.js');

var BetState = Enums.BetState;

exports.server = function(socket) {
    console.log("Sending hello world!!!!!");
    socket.on('REQ_BETLIST', function(data) {
	var active_list = [];
	var expired_list = [];
	var settled_list = [];
	BETS.forEach(function(value, key) {
	    console.log(value.name + ": " + value.state);
	    if (value.state == BetState.ACTIVE) {
		active_list.push(value.name);
	    }
	    else if (value.state == BetState.EXPIRED) {
		expired_list.push(value.name);
	    }
	    else {
		settled_list.push(value.name);
	    }
	});
	socket.emit('BETLIST', {'Active': active_list, 'Expired': expired_list, 'Settled': settled_list});
    });
}
