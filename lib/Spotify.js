var async = require('async');
var request = require('request');
var spotifyUrl = "https://api.spotify.com/v1/";

function Spotify() {
  this.allTracks = [];
  this.trackTracks = [];
  this.artistTracks = [];
  this.albumTracks = [];
  this.finalPlaylist = [];
}

Spotify.prototype.massSpotifyQueries = function(queries, done) {
  var self = this;

  queryTypes = [
    'artist',
    'album',
    'track'
  ];

  var allTracks = [];

  if (queries.length > 4) {
    // need to come up with a more elegant solution here
    queries.length = 4;
  }

  async.each(queries, function(query, queryCallback) {
    async.each(queryTypes, function(type, typeCallback) {
      self.querySpotify(type, query, function() {
        typeCallback();
      });
    }, function(err) {
      if (err) {
      } else {
        queryCallback();
      }
    });
  }, function(err) {
    if (err) {
    } else {
      self.allTracks = self.allTracks.concat(self.trackTracks);
      self.allTracks = self.allTracks.concat(self.artistTracks);
      self.allTracks = self.allTracks.concat(self.albumTracks);
      console.log('PRE HASH', self.allTracks);
      self.allTracks = self.hashOutDupes(self.allTracks);
      console.log('SELF ALLTRACKS', self.alltracks);
      self.finalPlaylist = self.scramblePlaylist(self.allTracks, 16);
      done(self.finalPlaylist);
    }
  });
};

Spotify.prototype.querySpotify = function(type, query, callback) {
  var self = this;
  queryUrl = spotifyUrl + 'search?q=' + query + '&type=' + type + "&theme=white&view=coverart&markey=US&limit=50";
  request(queryUrl, function(err, response, body) {
    if (err) {
      console.log("Error in Spotify API search request");
    } else {
      var data = JSON.parse(body);

      switch (type) {
        case 'track': 
          // console.log("TRACKS!!!", data.tracks.items);
          var tracks = self.filterPopularity(data.tracks.items);
          self.trackTracks = self.trackTracks.concat(tracks);
          callback();
          break;

        case 'artist':
          var artists = self.filterPopularity(data.artists.items);
          // console.log("ARTISTS!!!", artists);

          if (artists) {
            if (artists.length > 4) {
              artists = self.sortPopularity(artists);
              artists.length = 4;
            }
            async.each(artists, function(artist, artistCallback) {
              self.getArtistTracks(artist.id, function(tracks) {
                self.artistTracks = self.artistTracks.concat(tracks);
                artistCallback();
              });   
            }, function(err) {
              if (err) {
              } else {
                callback();                
              }
            });  
          } else {
            callback();
          }
          break;

        case 'album':
          var albums = data.albums.items;

          if (albums) {
            if (albums.length > 4) {
              // albums do not have popularity and so can't be sorted.
              albums.length = 4;
            }
            async.each(data.albums.items, function(album, albumCallback) {
              self.getAlbumTracks(album.id, function(tracks) {
                self.albumTracks = self.albumTracks.concat(tracks);
                albumCallback();
              });
            }, function(err) {
              if (err) {
              } else {
                callback();
              }
            });  
          } else {
            callback();
          }
          break;
      }
    }
  });
};

Spotify.prototype.getArtistTracks = function(artistId, callback) {
  var self = this;
  queryUrl = spotifyUrl + 'artists/' + artistId + '/top-tracks?' + 'country=US&limit=50';
  request(queryUrl, function(err, reponse, body) {
    if (err) {
      console.log('Error with request for Spotify artist top tracks');
    } else {
      var data = JSON.parse(body);
      var tracks = self.filterPopularity(data.tracks);
      // console.log("ARTIST TRACKS!!!", data);
      callback(tracks);
    }
  });
};

Spotify.prototype.getAlbumTracks = function(albumId, callback) {
  var self = this;
  queryUrl = spotifyUrl + 'albums/' + albumId + '/tracks/?' + 'country=US&limit=50';
  request(queryUrl, function(err, reponse, body) {
    if (err) {
      console.log('Error with request for Spotify album tracks');
    } else {
      var data = JSON.parse(body);
      var tracks = self.filterPopularity(data.items);
      callback(tracks);
    }
  });
};

Spotify.prototype.hashOutDupes = function(array) {
  var hash = {};
  var result = [];
  array.forEach(function(item) {
    if (hash[item.id.toString()]) {
      return;
    } else {
      hash[item.id] = item;
    }
  });
  for (var key in hash) {
    result.push(hash[key]);
  }
  return result;
};

Spotify.prototype.sortPopularity = function(array) {
  return array.sort(function(a, b) {
    return b.popularity - a.popularity;
  });
};

Spotify.prototype.filterPopularity = function(array) {
  var filtered = [];
  if (array) {
    filtered = array.filter(function(item) {
      return item.popularity > 0;
    });  
  }
  return filtered;
};

Spotify.prototype.scramblePlaylist = function(array, max) {
  var result = [];
  var rand = 0;

  array.forEach(function(item) {
    rand = Math.floor(Math.random() * result.length);
    if (result.length < max) {
      result.splice(rand, 0, item);  
    } else {
      return;
    }
  });

  // console.log(result);
  return result;
};

module.exports = Spotify;