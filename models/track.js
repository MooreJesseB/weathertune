module.exports = function(sequelize, DataTypes) {
  var Track = sequelize.define('track', {
    trackName: DataTypes.STRING,
    artist: DataTypes.STRING,
    album: DataTypes.STRING,
    trackId: DataTypes.STRING,
    icon: DataTypes.STRING,
    weatherId: {
      type: DataTypes.INTEGER,
            foreignKey: true
    }
  });
  return Track;
};