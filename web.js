var fs = require('fs');
var express = require('express');

var app = express.createServer(express.logger());

var msg = fs.readFileSync('html/index.html').toString();

app.get('/', function(request, response) {
  response.send(msg);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
