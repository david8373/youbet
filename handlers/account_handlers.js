var Consts = require('../node/consts.js');
var Security = require('../node/security.js');

var USERNAME_RE = Consts.USERNAME_RE;
var PASSWORD_RE = Consts.PASSWORD_RE;
var EMAIL_RE = Consts.EMAIL_RE;

exports.signup_get = function(req, res) {
    res.render('signup', {error:''});
};

exports.signup_post = function(req, res) {
    var username = req.body.username;
    var email = req.body.email;
    var password1 = req.body.password1;
    var password2 = req.body.password2;

    if (!username || !email || !password1 || !password2) {
	var error = 'All fields are required';
    }
    else if (username !== encodeURIComponent(username)) {
	var error = 'Username may not contain any non-url-safe characters';
    }
    else if (!username.match(USERNAME_RE)) {
	var error = 'Username should be 3-20 characters/numbers/underscore/dash';
    }
    else if (!email.match(EMAIL_RE)) {
	var error = 'Email is invalid';
    }
    else if (password1 !== password2) {
	var error = 'Passwords don\'t match';
    }
    else if (!password1.match(PASSWORD_RE)) {
	var error = 'Password should be between 3 - 20 characters';
    }

    if (error) {
	res.status(403);
	res.render('signup', {error:error});
	return;
    }

    var username_h = Security.make_secure_username(username);
    var password_h = Security.make_secure_password(password1);

    var query = POSTGRES_CLIENT.query({text: 'SELECT * FROM users where username=$1', values: [username_h]}, function(err, result) {
	if (err) {
	    console.log(err);
	    res.render('signup', {error: err});
	    return;
	}
	if (result && result.rowCount > 0) {
	    res.status(403);
	    res.render('signup', {error: 'Username is already taken'});
	    return;
	}
    });

    var query = POSTGRES_CLIENT.query({text: 'INSERT INTO users VALUES ($1, $2, $3, $4)', values: [username_h, email, password_h, new Date()]}, function(err, result) {
	if (err) {
	    console.log(err);
	    res.render('signup', {error: err});
	    return;
	}
	res.cookie('username', username_h, {maxAge: 900000, httpOnly: true});
	res.redirect('/home');
	return;
    });
};

exports.signin_get = function(req, res) {
    res.render('signin', {error:''});
};

exports.signin_post = function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
	var error = 'All fields are required';
    }
    else if (username !== encodeURIComponent(username)) {
	var error = 'Username may not contain any non-url-safe characters';
    }
    else if (!username.match(USERNAME_RE)) {
	var error = 'Username should be 3-20 characters/numbers/underscore/dash';
    }
    else if (!password.match(PASSWORD_RE)) {
	var error = 'Password should be between 3 - 20 characters';
    }

    if (error) {
	res.status(403);
	res.render('/signup', {error:error});
	return;
    }

    var username_h = Security.make_secure_username(username);
    var password_h = Security.make_secure_password(password);

    var query = POSTGRES_CLIENT.query({text: 'SELECT * FROM users where username=$1', values: [username_h]}, function(err, result) {
	if (err) {
	    console.log(err);
	    res.render('signup', {error: err});
	    return;
	}
	if (!result || result.rowCount == 0) {
	    res.status(403);
	    res.render('signin', {error: 'Username does not exist'});
	    return;
	}
	if (result.rowCount > 1) {
	    console.warn('More than one DB row with same username!');
	}
	console.log(result.rows[0]);
	var password_h_saved = result.rows[0].password;
	if (Security.check_secure_password(password, password_h_saved)) {
	    res.cookie('username', username_h, {maxAge: 900000, httpOnly: true});
	    res.redirect('/home');
	    return;
	}
	else {
	    res.status(403);
	    res.render('/signin', {error: 'Password incorrect'});
	    return;
	}
    });
};

exports.logout_get = function(req, res) {
    res.clearCookie('username');
    res.redirect('/signin');
    return;
};
