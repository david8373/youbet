var Security = require('../node/security.js');

exports.home_get = function(req, res) {
    if (!req.cookies.username) {
	console.log("No username in cookies, redirecting to signin page");
	res.redirect('/signin');
	return;
    }
    if (!Security.check_secure_username(req.cookies.username)) {
	console.warn("Username in cookies does not match (could have been changed manually at client side), redirecting to signin page");
	res.redirect('/signin');
	return;
    }
    res.render('home');
};
