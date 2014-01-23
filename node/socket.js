exports.server = function(socket) {
    console.log("Sending hello world");
    setInterval(function() {
	socket.emit('BETLIST', {'Active': ['Yuhan1', 'Yuhan2'], 'Expired': ['Yuhan3'], 'Settled': ['Yuhan4', 'Yuhan5']});
    }, 5000);
    socket.on('my other event', function(data) {
	console.log(data);
    });
}
