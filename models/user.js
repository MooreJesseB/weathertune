var bcrypt = require("bcrypt");
var passport = require("passport");
var passportLocal = require("passport-local");
var salt = bcrypt.genSaltSync(Number(process.env.WEATHERTUNE_SALT));

module.exports = function (sequelize, DataTypes){
   var User = sequelize.define('user', {
     username: { 
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          len: [6, 30]
        }
    },
    password: { 
      type: DataTypes.STRING,
      validate: {
          notEmpty: true
        }
    }
  },

  {
    classMethods: {
      associate: function(db) {
        User.hasMany(db.weather);
    },

      encryptPass: function(password) {
        var hash = bcrypt.hashSync(password, salt);
        return hash;
    }, 
      comparePass: function(userpass, dbpass) {
      // don't salt twice when you compare....watch out for this
        return bcrypt.compareSync((userpass), dbpass);  
    },
      createNewUser:function(username, password, err, success ) {
        if(password.length < 6) {
          err({message: "Password must be more than six characters"});
        }
        else{
        User.create({
            username: username,
            password: this.encryptPass(password)
          }).error(function(error) {
            console.log(error);
            if(error.username){
              console.log("Username too short");
              err({message: 'Username must be at least 6 characters long', username: username});
            }
            else{
              console.log("Username already exists");
              err({message: 'An account with that username already exists', username: username});
              }
          }).success(function(user) {
            console.log("Account Created");
            success({message: 'Account successfully created!', user: user});
          });
        }
      },  
    
      } // close classMethods
    } //close classMethods outer 

  ); // close define user

  passport.use(new passportLocal.Strategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback : true
    },

    function(req, username, password, done) {
      // find a user in the DB
      User.find({
          where: {
            username: username
          }
        })
        // when that's done, 
        .done(function(error,user){
          if(error){
            console.log(error);
            return done (err, req.flash('failure', 'Oops! Something went wrong.'));
          }
          if (user === null || !User.comparePass(password, user.password)){
            return done (null, false, req.flash('failure', 'Username/Password combination not valid'));
          }
          done(null, user, req.flash('success', 'Welcome to Weathertune ' + username + "!")); 
        });
    }));
      
  return User;
}; // close User function

  



