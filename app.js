var fs = require('fs');
var path = require('path');
var express = require('express');

var app = express.createServer(express.logger());

var msg = fs.readFileSync('html/signup.html').toString();

app.get('/', function(request, response) {
  response.send(msg);
});

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
