var bodyParser = require('body-parser'),
  request = require('request'),
  passport = require('passport'),
  passportLocal = require('passport-local'),
  cookieParser = require('cookie-parser'),
  cookieSession = require('cookie-session'),
  flash = require('connect-flash'),
  express = require('express');
  helpers = require('./lib/helpers.js');

var weatherKey = process.env.WORLD_WEATHER_ONLINE_KEY;

var app = express();
var db = require('./models/index');

var tempData = {};
var tempTrackData = [];

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); 

app.use(cookieSession({
  secret: 'superdupersecret',
  name: 'cookie created by vergo',
  maxage: 360000
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// prepare our serialize funcitons
passport.serializeUser(function(user, done) {
  console.log('SERIALIZED JUST RAN');
  done(null, user.id);
})

passport.deserializeUser(function(id, done) {
  console.log('DESERIALIZED JUST RAN');
  db.user.find({
    where: {
      id: id
    }
  })
  .done(function(error, user) {
    done(error, user);
  });
});

app.get('/', function(req, res) {
  res.render('index', {home: 'index'});
});

app.get('/signup', function(req, res) {
  res.render('signup', {home: 'signup'});
});

app.get('/home', function(req, res) {
  res.render('home', {home: 'home'});
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/index',
  failureFlash: true
}));

app.post('/create', function(req, res) {
  db.user.createNewUser(req.body.username, req.body.password, 
    function(err) {
      res.render("signup", {message: err.message, username: req.body.username, home:'signup'})
    },
    function(success) {
      res.render('index', {message: success.message, home: 'index'});
    });
});

app.post('/search', function(req, res) {
  var weatherUrl = "http://api.worldweatheronline.com/free/v1/weather.ashx?q=";
  var wQuery = weatherUrl + req.body.location + "&format=json&key=" + weatherKey;
  var trackArr = [];

  request(wQuery, function(err, response, body) {
    if(!err) {
      var data = JSON.parse(body);
      tempData = data;
      helpers.makePlayList(res, data.data.current_condition[0].weatherDesc[0].value, function(query) {
        request(query, function(err, response, body) {
          if (!err) {
           var data = JSON.parse(body);
            data.tracks.items.forEach(function(track) {
              trackArr.push(track.uri.split(":")[2]);
            });
            tempTrackData = helpers.scrambleArr(trackArr);
            res.redirect('/results');
          } else {
            console.error("ERROR!", err);
          }
        });
      });
    } else {
      console.error("Error!!!", err);
    }
  });
});

app.get('/results', function(req, res) {
  var description = tempData.data.current_condition[0].weatherDesc[0].value,
    weatherIcon = tempData.data.current_condition[0].weatherIconUrl[0].value,
    playList = tempTrackData.join(",");
    console.log(playList);
  res.render('results', {description: description, weatherIcon: weatherIcon, playList: playList, home: 'home'});
});

app.listen(3000, function(){
  console.log("LISTENING ON PORT 3000")
});