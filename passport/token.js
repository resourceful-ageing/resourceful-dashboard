var BearerStrategy = require('passport-http-bearer').Strategy;
var User = require('../models/user');

module.exports = function(passport) {
	passport.use(  
		new BearerStrategy(
			function(token, done) {
				User.findOne({ 'access_token': token }, {}, {select : 'access_token'}, 
					function(err, user) {
						if(err) {
							console.log("problem1");
							return done(err)
						}
						if(!user) {
							console.log("problem2");
							return done(null, false)
						}

						return done(null, user, { scope: 'all' })
					}
				);
			}
		)
	);
}