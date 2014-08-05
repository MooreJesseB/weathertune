var bodyParser = require('body-parser'),
  request = require('request'),
  express = require('express');

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); 

app.get('/', function(req, res) {
  res.render('index');
});

// var spotify = "https://api.spotify.com/v1/search?q=led%20zeppelin&type=artist"

// app.get('/get_spotify', function(req, res) {
//   request(spotify, function(error, response, body) {
//     if(!error) {
//       var json = JSON.parse(body);
//       res.send(json);
//     }
//   });
// })

// app.get('/get_weather', function(req, res) {
//   var apiKey = "1d41e98e7701b071d549643568c17d66d0458986";
//   var url = "http://api.worldweatheronline.com/free/v1/weather.ashx?q=san%20francisco&format=json&key=" + apiKey;
//   request(url, function(error, response, body) {
//     if(!error) {
//       var json = JSON.parse(body)
//       // res.render('show', {json: json})    ;
//       res.send(json);
//     }
//     else {
//       console.log("ERROR!!!", error);
//     }
//   });
// });

app.listen(3000, function(){
  console.log("LISTENING ON PORT 3000")
});