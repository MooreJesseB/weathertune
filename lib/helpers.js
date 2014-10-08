
var helpers = {

  // returns a randomly scrambled array
  scrambleArr: function(arr, max) {
    var tempArr = arr;
    var result = [];
    var index = 0;
    var rand = 0;
    if (max > arr.length) {
      max = arr.length;
    }

    while (index < max) {
      rand = Math.floor(Math.random()*arr.length);
      result.push(tempArr.splice(rand, 1));
      index++;
    }
    // console.log(result);
    return result;
  },

  // makes a spotify playlist from a search string
  makePlayList: function(res, searchString, done) {
    var spotifyUrl = "https://api.spotify.com/v1/search",
      artist = "&type=artist",
      album = "&type=album",
      track = "&type=track",
    
    // get track list
    sQuery = spotifyUrl + "?q=" + searchString + "&type=track" + "&theme=white&view=coverart";
    // get album list
    // get artist list

    done(sQuery);
  }
};

module.exports = helpers;