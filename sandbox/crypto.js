var crypto = require('crypto');
console.log(crypto.getHashes());

var shasum = crypto.createHash('md5');
shasum.update('I am so secret');
console.log(shasum.digest('hex'));

SECURITY_KEY='eee';
hash_str = function(s) {
    return crypto.createHmac('md5', SECURITY_KEY).update(s).digest('hex');
}
 console.log(hash_str('eee'));
