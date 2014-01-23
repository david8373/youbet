$(document).ready(function() {
    var socket = io.connect('http://ec2-54-213-10-197.us-west-2.compute.amazonaws.com:8080');
    console.log(socket);
    socket.on('BETLIST', function(data) {
	var active_list = data.Active;
	$("#active-dropdown").empty();
	for (var i in active_list) {
	    var $newElem = $("<li><a href=\"#\">" + active_list[i].toString() + "</a></li>");
	    $newElem.appendTo("#active-dropdown");
	}
	var expired_list = data.Expired;
	$("#expired-dropdown").empty();
	for (var i in expired_list) {
	    var $newElem = $("<li><a href=\"#\">" + expired_list[i].toString() + "</a></li>");
	    $newElem.appendTo("#expired-dropdown");
	}
	var settled_list = data.Settled;
	$("#settled-dropdown").empty();
	for (var i in settled_list) {
	    var $newElem = $("<li><a href=\"#\">" + settled_list[i].toString() + "</a></li>");
	    $newElem.appendTo("#settled-dropdown");
	}
	socket.emit('my other event', {my: 'data'});
    });
});
