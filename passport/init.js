var login = require('./login');
var signup = require('./signup');
var bearer = require('./token');
var User = require('../models/user');

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function(user, done) {
        //console.log('serializing user: ');console.log(user);
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        userDb.find({ selector: {_id: id }}, function(err, user) {
            if (typeof(user) !== 'undefined') {
              done(err, user.docs[0]);
            }
        });
    });

    // Setting up Passport Strategies for Login and SignUp/Registration
    login(passport);
    signup(passport);
    bearer(passport);
}