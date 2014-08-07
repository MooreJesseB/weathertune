var bodyParser = require('body-parser'),
  request = require('request'),
  passport = require('passport'),
  passportLocal = require('passport-local'),
  cookieParser = require('cookie-parser'),
  cookieSession = require('cookie-session'),
  flash = require('connect-flash'),
  express = require('express'),
  async = require('async'),
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

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

app.get('/account', function(req, res) {
  var histories = [];
  var index = 0;
  db.weather.findAll({
    where: {
      userId: req.user.id
    },
      include: [db.track]
  })
  .success(function(weathers) {
    res.render('account', {weathers: weathers, home: 'home'});
  });
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
  var playlistObj = {};
  var newWeather = {};
  var newTrack = {};

  // console.log(req.user);
  // res.send(req.user);
  // return;

  request(wQuery, function(err, response, body) {
    if(!err) {
      var data = JSON.parse(body);
      tempData = data,

      // JSON testing
      // res.send(data);
      // return;
      
      // make new weather object
      newWeather.location = data.data.request[0].query;
      newWeather.description = data.data.current_condition[0].weatherDesc[0].value;
      newWeather.temperature = data.data.current_condition[0].temp_F;
      newWeather.icon = data.data.current_condition[0].weatherIconUrl[0].value;

      // create new weather db entry
      db.user.find(req.user.id)
        .success(function(foundUser) {
          db.weather.create(newWeather)
            .success(function(newWeather){
              foundUser.addWeather(newWeather)
              .success(function(weather) {

                // make playlist
                helpers.makePlayList(res, newWeather.description, function(query) {
                  request(query, function(err, response, body) {
                    if (!err) {
                     var data = JSON.parse(body);

                      // make new track entries in db
                      data.tracks.items.forEach(function(track) {
                        newTrack.trackName = track.name;
                        newTrack.artist = track.artists[0].name;
                        newTrack.album = track.album.name;
                        newTrack.icon = track.album.images[2].url;
                        newTrack.trackId = track.uri.split(":")[2];

                        db.track.create(newTrack)
                          .success(function(track) {
                            newWeather.addTrack(track);
                          });

                        // this is for the playbutton on the rendered page
                        trackArr.push(track.uri.split(":")[2]);
                      });
                      tempTrackData = helpers.scrambleArr(trackArr).join(',');
                      res.redirect('/results');

                    } else {
                      console.error("ERROR!", err);
                    }
                  });
                });
              });
            });
        });
    } else {
      console.error("Error!!!", err);
    }
  });
});

app.get('/results', function(req, res) {
  var description = tempData.data.current_condition[0].weatherDesc[0].value,
    weatherIcon = tempData.data.current_condition[0].weatherIconUrl[0].value;
  res.render('results', {description: description, weatherIcon: weatherIcon, playList: tempTrackData, home: 'home'});
});

app.listen(3000, function(){
  console.log("LISTENING ON PORT 3000")
});