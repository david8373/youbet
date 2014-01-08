exports.signup_get = function(req, res) {
    res.render('signup');
};

exports.signup_post = function(req, res) {
    console.log("Posting!!!");
    console.log(req.body.email);
    console.log(req.body.password);
    console.log(req.body.remember);
    //res.redirect('/signup');
    res.redirect('back');
};
