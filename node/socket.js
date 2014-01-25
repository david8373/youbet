var Enums = require('./enums.js');

var BetState = Enums.BetState;

exports.server = function(socket) {
    socket.on('REQ_BETLIST', function(data) {
	console.log('Got REQ_BETLIST request');
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

    socket.on('REQ_BET', function(data) {
	console.log('Got REQ_BET request');
    });
}
