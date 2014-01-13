exports.home_get = function(req, res) {
    if (!req.cookies.username) {
	res.redirect('/signin');
    }
    res.render('home');
};
