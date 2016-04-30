$(document).ready(function() {
    SOCKET = io.connect('http://ec2-52-33-150-22.us-west-2.compute.amazonaws.com:8080');

    SOCKET.emit('REQ_BETLIST', {});

    SOCKET.on('BETLIST', on_BETLIST);
});

var on_BETLIST = function(data) {
//    var active_list = data.Active;
//    $("#active-dropdown").empty();
//    for (var i in active_list) {
//	var name = active_list[i].toString();
//	var content = "<li><a href=\"#\" id=\"" + name + "\">" + name + "</a></li>";
//	var $newElem = $(content);
//	$newElem.click(function(e) {
//	    e.preventDefault();
//	    SOCKET.emit('REQ_BET', {'name': name});
//	});
//	$newElem.appendTo("#active-dropdown");
//    }
//    var expired_list = data.Expired;
//    $("#expired-dropdown").empty();
//    for (var i in expired_list) {
//	var name = expired_list[i].toString();
//	var content = "<li><a href=\"#\" id=\"" + name + "\">" + name + "</a></li>";
//	var $newElem = $(content);
//	$newElem.click(function(e) {
//	    e.preventDefault();
//	    SOCKET.emit('REQ_BET', {'name': name});
//	});
//	$newElem.appendTo("#expired-dropdown");
//    }
//    var settled_list = data.Settled;
//    $("#settled-dropdown").empty();
//    for (var i in settled_list) {
//	var name = settled_list[i].toString();
//	var content = "<li><a href=\"#\" id=\"" + name + "\">" + name + "</a></li>";
//	var $newElem = $(content);
//	$newElem.click(function(e) {
//	    e.preventDefault();
//	    SOCKET.emit('REQ_BET', {'name': name});
//	});
//	$newElem.appendTo("#settled-dropdown");
//    }
}
