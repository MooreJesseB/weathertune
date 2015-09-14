function Playlist(tracks, images, weather, icon, thumbnails) {
  this.tracks = tracks;
  this.images = images;
  this.weather = weather;
  this.icon = icon;
  this.thumbnails = [];
}

module.exports = Playlist;