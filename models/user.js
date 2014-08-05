var bcrypt = require("bcrypt"),
  salt =  bcrypt.genSaltSync(10),
  passport = require('passport'),
  passportLocal = require('passport-local');

  module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define('user', {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [6, 30],
        }
      },
      password: {
        type:DataTypes.STRING,
        validate: {
          notEmpty: true,
        }
      }
    },
    {
      classMethods: {
        encryptPass: function(password) {
          var hash = bcrypt.hashSync(password, salt);
          return hash;
      },
        comparePass: function(userpass, dbpass) {
          return bcrypt.compareSync(userpass, dbpass);
      },
        createNewUser: function(username, password, err, success) {
          if (password.length <6) {
            err({message: "Password should be more than six characters"});
          } else {
            User.create({
              username: username,
              password: User.encryptPass(password)
            }).error(function(error) {
              if(error.username) {
                err({message: "Your username should be at least 6 characters long", username: username});
              } else {
                err({message: "An account with that username already exists", username: username});
              }
            }).success({message: "Account created, please log in now"})
          }
        }
      }
    }
  );
  
    passport.use(new passportLocal.Strategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallBack: true
    },
    function(req, username, password, done) {
      User.find({
        where: {
          username: username
        }
      })
      .done(function(error, user) {
        if (error) {
          console.log(error)
          return done(err, req.flash('loginMessage', 'Username does not exist'))
        }
        if (user === null) {
          return done(null, false, req.flash('loginMessage', 'Invalid Password'))
        }
        done(null, user);
      });
    }));
    return User;
};