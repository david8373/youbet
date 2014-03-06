$(document).ready(function() {
    SOCKET = io.connect('http://ec2-54-213-10-197.us-west-2.compute.amazonaws.com:8080');

    var betname = getBetName();
    var username = getUsername();
    if (betname && username) {
	console.log('Requesting BET_SUBSCRIBE: username=' + username + ", betname=" + betname);
	SOCKET.emit('BET_SUBSCRIBE', username, betname)
    }

    SOCKET.on('BET_LIST', on_BET_LIST);
    SOCKET.on('BET_UPDATE_STATIC', on_BET_UPDATE_STATIC);
    SOCKET.on('BET_UPDATE_DEPTH', on_BET_UPDATE_DEPTH);
    SOCKET.on('BET_UPDATE_ORDER', on_BET_UPDATE_ORDER);
    SOCKET.on('BET_UPDATE_TRADE', on_BET_UPDATE_TRADE);
    SOCKET.on('BET_UPDATE_PARTICIPANTS', on_BET_UPDATE_PARTICIPANTS);

    // State changes
    SOCKET.on('BET_EXPIRE', on_BET_EXPIRE);
    SOCKET.on('BET_SETTLE', on_BET_SETTLE);

    // Settlement messages
    SOCKET.on('BET_UPDATE_SETTLEMENT_TRADE', on_BET_UPDATE_SETTLEMENT_TRADE);
    SOCKET.on('BET_UPDATE_SETTLEMENT', on_BET_UPDATE_SETTLEMENT);

    // Response messages
    SOCKET.on('BET_CANCEL_RESPONSE', on_CANCEL_RESPONSE);
    SOCKET.on('BET_NEWORDER_RESPONSE', on_BET_NEWORDER_RESPONSE);
    SOCKET.on('BET_INVITE_RESPONSE', on_BET_INVITE_RESPONSE);
    SOCKET.on('BET_SETTLE_RESPONSE', on_BET_SETTLE_RESPONSE);

    $('#button-invite').on("click", {'username': getUsername(),
	'betname': getBetName()}, function(e) {
	    var invite = $("#input-invite").val().trim();
	    console.log("Invite button clicked, invite=" + invite);
	    SOCKET.emit('BET_INVITE', e.data.username, e.data.betname, invite);
	});

    $('#button-bid').on("click", {'username': getUsername(), 
	'betname': getBetName()}, function(e) {
	    var price = $("#input-price").val();
	    var size = $("#input-size").val();
	    console.log("Bid button clicked, price=" + price + ", size=" + size);
	    SOCKET.emit('BET_NEWORDER', e.data.username, e.data.betname, 'Bid', price, size);
	});
    $('#button-offer').on("click", {'username': getUsername(), 
	'betname': getBetName()}, function(e) {
	    var price = $("#input-price").val();
	    var size = $("#input-size").val();
	    console.log("Ask button clicked, price=" + price + ", size=" + size);
	    SOCKET.emit('BET_NEWORDER', e.data.username, e.data.betname, 'Ask', price, size);
	});

    $('#button-settle').on("click", {'username': getUsername(),
	'betname': getBetName()}, function(e) {
	    var settlementPrice = $("#input-settle").val().trim();
	    console.log("Settle button clicked, settlementPrice=" + settlementPrice);
	    SOCKET.emit('BET_SETTLE', e.data.username, e.data.betname, settlementPrice);
	});

});

var getBetName = function() {
    var betMatch = $(location).attr('href').match('\/home\/(.+)');
    if (betMatch) {
	return betMatch[1];
    }
    return null;
}

var getUsername = function() {
    var usernameMatch = document.cookie.match('username=(.+);*');
    if (usernameMatch) {
	return usernameMatch[1];
    }
    return null;
}

var on_BET_LIST = function(data) {
    console.log("Received BET_LIST update on socket");
    console.log(data);
    var active_list = data.active;
    $("#active-dropdown").empty();
    for (var i in active_list) {
	var name = active_list[i].toString();
	var content = "<li><a href=\"/home/" + name + "\">" + name + "</a></li>";
	var $newElem = $(content);
	$newElem.appendTo("#active-dropdown");
    }
    var expired_list = data.expired;
    $("#expired-dropdown").empty();
    for (var i in expired_list) {
	var name = expired_list[i].toString();
	var content = "<li><a href=\"/home/" + name + "\">" + name + "</a></li>";
	var $newElem = $(content);
	$newElem.appendTo("#expired-dropdown");
    }
    var settled_list = data.settled;
    $("#settled-dropdown").empty();
    for (var i in settled_list) {
	var name = settled_list[i].toString();
	var content = "<li><a href=\"/home/" + name + "\">" + name + "</a></li>";
	var $newElem = $(content);
	$newElem.appendTo("#settled-dropdown");
    }
}

var on_BET_UPDATE_STATIC = function(data) {
    console.log("Received BET_UPDATE_STATIC update on socket");
    if (data.state.toUpperCase() == 'ACTIVE') {
	var label = 'label-success';
    }
    else if (data.state.toUpperCase() == 'EXPIRED') {
	var label = 'label-warning';
    }
    else if (data.state.toUpperCase() == 'SETTLED') {
	var label = 'label-danger';
    }

    var content = data.name + "\n<small>\n" + data.expiry 
	+ "\n<span id=\"bet-static\" class=\"label " + label + "\">" + data.state + "</span></small>";
    $("#bet-header").html(content);
    $("#bet-description").text(data.description);
    $("#bet-min-val").text("Min value " + data.minVal);
    $("#bet-max-val").text("Max value " + data.maxVal);
    $("#bet-tick-size").text("Min tick size " + data.tickSize);
}

var on_BET_UPDATE_DEPTH = function(data) {
    console.log("Received BET_UPDATE_DEPTH update on socket");
    $(".chart").html("");
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
	text += possible.charAt(Math.floor(Math.random() * possible.length));
    $(".chart").attr("id", text);

    chart(data.depth);
}

var on_BET_UPDATE_ORDER = function(data) {
    console.log("Received BET_UPDATE_ORDER update on socket");
    if ($('#order-panel').length > 0) { // Only update if that panel still exists
        $("#order-list").empty();
        for (var i in data.orders) {
            var id = data.orders[i].uuid;
            var cancelButtonId = "order-cancel-" + id;
            var orderContent = "<li class=\"list-group-item\" id=\"order-" + data.orders[i].uuid + "\">\n" 
                + data.orders[i].side + " " 
                + data.orders[i].remainingSize + "/"
                + data.orders[i].totalSize + " @"
                + data.orders[i].price + "\n"
                + "<button class=\"btn btn-default btn-xs\" type=\"button\" style=\"float: right;\"" 
                + " id=\"" + cancelButtonId + "\">Cancel</button>"
                + "\n</li>";
            var $newOrder = $(orderContent);
            $newOrder.appendTo("#order-list");
            $("#" + cancelButtonId).on("click", {'username': getUsername(), 'betname': getBetName(), 'id': id}, function(e) {
                SOCKET.emit('BET_CANCEL', e.data.username, e.data.betname, e.data.id);
            });
        }
    }
}

var on_BET_UPDATE_TRADE = function(data) {
    console.log("Received BET_UPDATE_TRADE update on socket");
    $("#trade-list").empty();
    for (var i in data.trades) {
	var tradeContent = "<li class=\"list-group-item\" id=\"trade-" + data.trades[i].uuid + "\">\n"
	    + data.trades[i].side + " "
	    + data.trades[i].size + " @"
	    + data.trades[i].price + "\n</li>";
	var $newTrade = $(tradeContent);
	$newTrade.appendTo("#trade-list");
    }
}

var on_BET_UPDATE_SETTLEMENT_TRADE = function(data) {
    console.log("Received BET_UPDATE_SETTLEMENT_TRADE update on socket");
    $("#trade-list").empty();
    for (var i in data.trades) {
	var tradeContent = "<li class=\"list-group-item\" id=\"trade-" + data.trades[i].uuid + "\">\n"
	    + data.trades[i].side + " "
	    + data.trades[i].size + " @"
	    + data.trades[i].price + " (p&l="
	    + data.trades[i].pnl + ")\n</li>";
	var $newTrade = $(tradeContent);
	$newTrade.appendTo("#trade-list");
    }
}

var on_BET_UPDATE_SETTLEMENT = function(data) {
    console.log("Received BET_UPDATE_SETTLEMENT update on socket");
    if ($('#settlement-result').length > 0)
	$('#settlement-result').remove();
    var settlePanel = "<div class=\"panel panel-primary\" id=\"settlement-result\">\n"
			+ "    <div class=\"panel-heading\">\n"
			+ "	<h4 class=\"panel-title\">\n"
			+ "	    Settlement result\n"
			+ "	</h4>\n"
			+ "    </div>\n"
			+ "    <div class=\"panel-body\">\n"
			+ "	<h4>\n"
			+ "	    Settlement price was " + data.settlementPrice 
			+ " and your P&L was " + data.pnl + ".\n"
			+ "	</h4>\n"
			+ "    </div>\n"
			+ "</div>\n";
    $('#left-column').append(settlePanel);
}

var on_BET_UPDATE_PARTICIPANTS = function(data) {
    console.log("Received BET_UPDATE_PARTICIPANTS update on socket");
    $('#participant-list').empty();
    for (var i in data.participants) {
	var participantContent = "<li class=\"list-group-item\" id=\"participant-" 
	    + data.participants[i] + "\">\n"
	    + data.participants[i] + "\n</li>";
	var $newParticipant = $(participantContent);
	$newParticipant.appendTo('#participant-list');
    }
}

var on_BET_EXPIRE = function(data) {
    console.log("Received BET_EXPIRE update on socket");
    var marketBody = "<div id=\"makret-body\" class=\"panel-body\">\n"
                   + "    <h4>\n"
                   + "        Bet has expired, market no longer available\n"
                   + "    </h4>\n"
                   + "</div>\n";
    $('#market-body').replaceWith(marketBody);
    if ($('#invite').length > 0)
	$('#invite').remove();
    if ($('#neworder-panel').length > 0)
        $('#neworder-panel').remove();
    if ($('#order-panel').length > 0)
        $('#order-panel').remove();

    if (data.bet_is_host) {
	var settlePanel = "<div class=\"panel panel-primary\">\n"
                        + "    <div class=\"panel-heading\">\n"
                        + "	<h4 class=\"panel-title\">\n"
                        + "	    Settlement\n"
                        + "	</h4>\n"
                        + "    </div>\n"
                        + "    <div class=\"panel-body\">\n"
                        + "	<div class=\"input-group\" id=\"settle\">\n"
                        + "	    <input type=\"text\" class=\"form-control\" id=\"input-settle\">\n"
                        + "	    <span class=\"input-group-btn\">\n"
                        + "		<button class=\"btn btn-default\" type=\"button\" id=\"button-settle\">Settle</button>\n"
                        + "	    </span>\n"
                        + "	</div>\n"
                        + "    </div>\n"
                        + "</div>\n";
	$(settlePanel).insertAfter($('#market-panel'));
    }

    $('#bet-static').text('EXPIRED');
    $('#bet-static').attr('class', 'label label-warning');
} 

var on_BET_SETTLE = function(data) {
    console.log("Received BET_SETTLE update on socket");
    $('#bet-static').text('SETTLED');
    $('#bet-static').attr('class', 'label label-danger');
}

var on_CANCEL_RESPONSE = function(response) {
    if (response.success) {
	$("#order-" + response.uuid).hide("fast", function() { $(this).remove(); });
    }
    else {
	$("#order-cancel-msg-" + response.uuid).remove();
	var $errorMsg = $("<div class=\"alert alert-warning\" id=\"order-cancel-msg-" + response.uuid + "\">" + response.msg + "</div>");
	$errorMsg.insertAfter("#order-" + response.uuid);
	setTimeout(function() {
	    $("#order-cancel-msg-" + response.uuid).hide("fast", function() { $(this).remove(); });
	}, 3000);
    }
}

var on_BET_NEWORDER_RESPONSE = function(response) {
    $("#input-price").val("");
    $("#input-size").val("");
    if (!response.success) {
	$("#order-msg").remove();
	var $errorMsg = $("<div class=\"alert alert-warning\" id=\"order-msg\">" + response.err + "</div>");
	$errorMsg.insertAfter("#button-offer");
	setTimeout(function() {
	    $("#order-msg").hide("fast", function() { $(this).remove(); });
	}, 3000);
    }
}

var on_BET_INVITE_RESPONSE = function(response) {
    $("#input-invite").val("");
    if (!response.success) {
	$("#invite-msg").remove();
	var $errorMsg = $("<div class=\"alert alert-warning\" id=\"invite-msg\">" + response.msg + "</div>");
	$errorMsg.insertAfter("#invite");
	setTimeout(function() {
	    $("#invite-msg").hide("fast", function() { $(this).remove(); });
	}, 3000);
    }
    else {
	$("#invite-msg").remove();
	var $successMsg = $("<div class=\"alert alert-success\" id=\"invite-msg\">" + response.msg + "</div>");
	$successMsg.insertAfter("#invite");
	setTimeout(function() {
	    $("#invite-msg").hide("fast", function() { $(this).remove(); });
	}, 3000);
    }
}

var on_BET_SETTLE_RESPONSE = function(response) {
    $("#input-settle").val("");
    if (!response.success) {
	$("#settle-msg").remove();
	var $errorMsg = $("<div class=\"alert alert-warning\" id=\"settle-msg\">" + response.msg + "</div>");
	$errorMsg.insertAfter("#settle");
	setTimeout(function() {
	    $("#settle-msg").hide("fast", function() { $(this).remove(); });
	}, 3000);
    }
    else {
	$("#settle-msg").remove();
    }
}
