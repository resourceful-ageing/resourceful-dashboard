var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');
var cloudant = require('cloudant');

module.exports = function(passport){

	passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) { 
            userDb.find({ selector: {name: username }},
              function(err, users) {
                if (err)
                      return done(err);
                  // Username does not exist, log the error and redirect back
                  if (users.docs.length !== 1){
                      //console.log('Experimenter Not Found with username '+username);
                      return done(null, false, req.flash('message', 'Experimenter Not found.'));
                  }
                  // User exists but wrong password, log the error
                  // Experimenter exists but wrong password, log the error
                  var user = users.docs[0];
                  if (!isValidPassword(user, password)){
                     // console.log('Invalid Password');
                      return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                  }
                  // Experimenter and password both match, return user from done method
                  // which will be treated like success
                  return done(null, user);
              }
            );
        })
    );

    var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);;
    }
}