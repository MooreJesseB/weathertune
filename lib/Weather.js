var request = require('request');
var weatherGlossary = require('../lib/weatherGlossary.js');

var weatherUrl = "http://api.worldweatheronline.com/free/v1/weather.ashx?q=";
var weatherKey = process.env.WORLD_WEATHER_ONLINE_KEY;

function WeatherModel(query, description, temp, icon) {
  this.query = query;
  this.description = description;
  this.temp = temp;
  this.icon = icon;
}

WeatherModel.prototype.startNewQuery = function(location, callback) {
  var query = weatherUrl + location + "&format=json&key=" + weatherKey;
  request(query, function(err, response, body) {
    callback(err, response, body);
  });
};

WeatherModel.prototype.parseWeatherType = function() {

  var queryTerms = this.description.toLowerCase().split(" ");
  if (queryTerms.length > 1) {
    queryTerms.push(this.description.toLowerCase());
  }

  // filter out non weather related words
  return queryTerms.filter(function(item) {
    return weatherGlossary.ignore.indexOf(item) === -1;
  });
};

module.exports = WeatherModel;