exports.server = function(socket) {
    console.log("Sending hello world");
    setInterval(function() {
	socket.emit('news', {hello: 'world'});
    }, 5000);
    socket.on('my other event', function(data) {
	console.log(data);
    });
}
