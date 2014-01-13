exports.server = function(socket) {
    console.log("Sending hello world");
    socket.emit('news', {hello: 'world'});
    socket.on('my other event', function(data) {
	console.log(data);
    });
}
