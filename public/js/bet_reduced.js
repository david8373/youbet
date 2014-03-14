$(document).ready(function() {
    SOCKET = io.connect('http://ec2-54-213-10-197.us-west-2.compute.amazonaws.com:8080');

    var username = getUsername();
    if (username) {
        var betname = '';
	console.log('Requesting BET_SUBSCRIBE: username=' + username + ", betname=" + betname);
	SOCKET.emit('BET_SUBSCRIBE', username, betname)
    }

    SOCKET.on('BET_LIST', on_BET_LIST);
});

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

