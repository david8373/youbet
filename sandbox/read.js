var read = require('read');
read({prompt: 'Password: ', silent: true}, function(err, password) {
    console.log(password);
});
