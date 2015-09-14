

var bodyParser = require('body-parser'),
  request = require('request'),
  passport = require('passport'),
  passportLocal = require('passport-local'),
  cookieParser = require('cookie-parser'),
  cookieSession = require('cookie-session'),
  flash = require('express-flash'),
  express = require('express'),
  async = require('async'),
  moment = require('moment'),
  Playlist = require('./lib/Playlist'),
  Spotify = require('./lib/Spotify'),
  Weather = require('./lib/Weather'),
  async = require('async');
  
var CurrentPlaylist = new Playlist();
var CurrentWeather = new Weather();

// var weatherKey = process.env.WORLD_WEATHER_ONLINE_KEY;

var app = express();
var db = require('./models/index');

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); 

app.use(cookieSession({
  secret: process.env.WEATHERTUNE_COOKIE_SESSION_SECRET,
  name: 'cookie created by vergobret',
  maxage: 500000
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function(req, res, next) {
  res.locals.sessionFlash = req.session.flash;
  delete req.session.sessionFlash;
  next();
});

// prepare our serialize funcitons
passport.serializeUser(function(user, done) {
  console.log('SERIALIZE JUST RAN');
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log('DESERIALIZE JUST RAN');
  db.user.find({
    where: {
      id: id
    }
  })
  .done(function(error, user) {
    done(error, user);
  });
});

// API
app.get('/', function(req, res) {
  res.render('index', {home: 'index', sessionFlash: res.locals.sessionFlash});
});


app.get('/about', function(req, res) {
  if (!req.user) {
    home = 'index';
  } else {
    home = 'home';
  }
  res.render('about', {home: home, about: true});
});


app.get('/contact', function(req, res) {
  if (!req.user) {
    home = 'index';
  } else {
    home = 'home';
  }
  res.render('contact', {home: home, contact: true});
});


app.get('/signup', function(req, res) {
  res.render('signup', {home: 'signup', sessionFlash: res.locals.sessionFlash});
});


app.get('/home', function(req, res) {
  if (!req.user) {
    res.redirect('/');
  } else {
    res.render('home', {home: 'home'});
  }
});


app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


app.get('/locationfail', function(req, res) {
  res.render('locationfail', {home: 'home'});
});

app.get('/account', function(req, res) {
  var histories = [];
  var index = 0;
  if (!req.user) {
    res.redirect('/');
  } else {
     db.weather.findAll({where: {userId: req.user.id}, include: [db.track], order: [['createdAt', 'DESC']]})
    .success(function(weathers) {
      var weathersFormatted = weathers.map(function(item) {
        var newItem = item;
        console.log("MOMENT", moment(item.createdAt).format('MMMM Do YYYY, h:mm:ss a'));
        newItem.createdAt = moment(item.createdAt).format('MMMM Do YYYY, h:mm:ss a');
        console.log('NEW ITEM', newItem.createdAt);
        return newItem;
      });
      res.render('account', {weathers: weathersFormatted, home: 'home'});
    });
  }
});


app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true,
}));


app.post('/create', function(req, res) {
  db.user.createNewUser(req.body.username, req.body.password, 
    function(err) {
      console.log("Signup failure");
      req.flash('failure', err.message);
      res.render("signup", {message: err.message, username: req.body.username, home:'signup'});
    },
    function(success) {
      req.login(success.user, function(err) {
        req.flash('success', success.message);
        res.redirect('/home');
      });
    });
});


app.post('/search', function(req, res) {
  var trackArr = [];
  var imgArr = [];
  var playlistObj = {};
  var newWeather = {};
  var newTrack = {};
  var spotifyQueries;
  var spotify = new Spotify();

  CurrentWeather.startNewQuery(req.body.location, function(err, reponse, body) {
    if (err) {
      console.error("Error in request/response to WWO API call!!!", err);
    } else {
      var data = JSON.parse(body);

      if (data.data.error) {
        console.log("Error in weather reponse data", data.data.error);
        res.redirect('/locationfail');
      } else {

        CurrentWeather.location = data.data.request[0].query;
        CurrentWeather.query = data.data.request[0].query;
        CurrentWeather.description = data.data.current_condition[0].weatherDesc[0].value;
        CurrentWeather.temperature = data.data.current_condition[0].temp_F;
        CurrentWeather.icon = data.data.current_condition[0].weatherIconUrl[0].value;

        // Add new weather to DB
        db.user.find(req.user.id).success(function(foundUser) {
          db.weather.create(CurrentWeather).success(function(newWeather) {
              foundUser.addWeather(newWeather).success(function(newWeather) {
                spotifyQueries = CurrentWeather.parseWeatherType();
                spotify.massSpotifyQueries(spotifyQueries, function(tracks) {

                  CurrentPlaylist.tracks = [];
                  CurrentPlaylist.thumbnails = [];

                  // make new track entries in db
                  tracks.forEach(function(track) {
                    newTrack.trackName = track.name;
                    newTrack.artist = track.artists[0].name;
                    newTrack.album = track.album.name;
                    newTrack.icon = track.album.images[2].url;
                    newTrack.trackId = track.id;

                    db.track.create(newTrack).success(function(track) {
                      newWeather.addTrack(track);

                      if (CurrentPlaylist.thumbnails.length < 14) {
                        CurrentPlaylist.thumbnails.push(track.icon);
                      }                    
                    });

                    CurrentPlaylist.tracks.push(track.id);
                  });
                  CurrentPlaylist.tracks = CurrentPlaylist.tracks.join(',');
                  res.redirect('/results');
                });
              });
          });
        });
      }
    }
  });
});


app.get('/results', function(req, res) {
  if (!req.user) {
    res.redirect('/');
  } else {
    res.render('results', 
      {description: CurrentWeather.description, 
        weatherIcon: CurrentWeather.icon,
        playList: CurrentPlaylist.tracks,
        thumbnails: CurrentPlaylist.thumbnails,
        weather: CurrentWeather,
        home: 'home'});
  }
});


app.get('*', function(req, res) {
  res.render('404', {home : 'home'});
});


app.listen(process.env.PORT || 3000, function(){
  console.log("LISTENING ON PORT 3000");
});