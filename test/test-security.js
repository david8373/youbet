var Security = require('../node/security.js');

SECURITY_KEY = 'imsosecret';

exports.testUsername = function(test){
    var username = 'username';
    var username_h = Security.make_secure_username(username);
    test.equal(username, Security.check_secure_username(username_h), 'Should recover same username');
    var sp = username_h.split('|');
    test.equal(null, Security.check_secure_username(sp[1]), 'Should fail on no splitters');
    var two_splitter = username_h + '|' + username;
    test.equal(null, Security.check_secure_username(two_splitter), 'Should fail on two splitters');
    test.done();
};

exports.testPassword = function(test) {
    var password = 'mypassword';
    var password_h = Security.make_secure_password(password);
    test.ok(Security.check_secure_password(password, password_h), 'Should return true for password');
    test.ok(!Security.check_secure_password('otherpassword', password_h), 'Should fail');
    test.done();
};
