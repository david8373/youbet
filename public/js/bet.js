$(document).ready(function() {
    SOCKET = io.connect('http://ec2-54-213-10-197.us-west-2.compute.amazonaws.com:8080');

    var betMatch = $(location).attr('href').match('\/home\/(.+)');
    if (betMatch) {
	var betname = betMatch[1];
    }
    var usernameMatch = document.cookie.match('username=(.+);*');
    if (usernameMatch) {
	var username = usernameMatch[1];
    }
    if (betname && username) {
	console.log('Requesting BET_SUBSCRIBE: username=' + username + ", betname=" + betname);
        SOCKET.emit('BET_SUBSCRIBE', username, betname)
    }

    SOCKET.on('BET_LIST', on_BET_LIST);
    SOCKET.on('BET_UPDATE', on_BET_UPDATE);
});

var on_BET_LIST = function(data) {
    var active_list = data.Active;
    $("#active-dropdown").empty();
    for (var i in active_list) {
	var name = active_list[i].toString();
	var content = "<li><a href=\"/home/" + name + "\">" + name + "</a></li>";
	var $newElem = $(content);
	$newElem.appendTo("#active-dropdown");
    }
    var expired_list = data.Expired;
    $("#expired-dropdown").empty();
    for (var i in expired_list) {
	var name = expired_list[i].toString();
	var content = "<li><a href=\"/home/" + name + "\">" + name + "</a></li>";
	var $newElem = $(content);
	$newElem.appendTo("#expired-dropdown");
    }
    var settled_list = data.Settled;
    $("#settled-dropdown").empty();
    for (var i in settled_list) {
	var name = settled_list[i].toString();
	var content = "<li><a href=\"/home/" + name + "\">" + name + "</a></li>";
	var $newElem = $(content);
	$newElem.appendTo("#settled-dropdown");
    }
}

var on_BET_UPDATE = function(data) {
    if (data.state.toUpperCase() == 'ACTIVE') {
	var label = 'label-success';
    }
    else if (data.state.toUpperCase() == 'EXPIRED') {
	var label = 'label-warning';
    }
    else if (data.state.toUpperCase() == 'SETTLED') {
	var label = 'label-danger';
    }

    var content = data.name + "\n<small>\nExpires " + data.expiry 
	+ "\n<span class=\"label " + label + "\">" + data.state + "</span></small>";
    $("#bet-header").html(content);
    $("#bet-description").text(data.description);
    $("#bet-min-val").text("Min value " + data.minVal);
    $("#bet-max-val").text("Max value " + data.maxVal);
    $("#bet-tick-size").text("Min tick size " + data.tickSize);

    $("#order-list").empty();
    for (var i in data.orders) {
	var orderContent = "<li class=\"list-group-item\" id=\"" + data.orders[i].uuid + "\">\n" 
	                   + data.orders[i].side + " " 
			   + data.orders[i].remainingSize + "/"
			   + data.orders[i].totalSize + " @"
			   + data.orders[i].price + "\n"
			   + "<button class=\"btn btn-default btn-xs\" type=\"button\" style=\"float: right;\">Cancel</button>"
			   + "\n</li>";
	var $newOrder = $(orderContent);
	$newOrder.appendTo("#order-list");
    }
    
    $("#trade-list").empty();
    for (var i in data.trades) {
	var tradeContent = "<li class=\"list-group-item\" id=\"" + data.trades[i].uuid + "\">\n"
	                   + data.trades[i].side + " "
			   + data.trades[i].size + " @"
			   + data.trades[i].price + "\n</li>";
	var $newTrade = $(tradeContent);
	$newTrade.appendTo("#trade-list");

    }

    //        'trades': trades};
    chart(data.depth, data.tickSize);
}
