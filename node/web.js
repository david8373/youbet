var fs = require('fs');
var express = require('express');

var app = express.createServer(express.logger());

var msg = fs.readFileSync('index.html').toString();

app.get('/', function(request, response) {
  fs.writeFileSync(__dirname + '/output.txt', 'Hello Node')
  var anothermsg = fs.readFileSync(__dirname + '/output.txt').toString();
  response.send(anothermsg)
  // response.send(msg);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
