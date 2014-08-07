module.exports = function(sequelize, DataTypes) {
  var Weather = sequelize.define('weather', {
    location: DataTypes.STRING,
    description: DataTypes.STRING,
    temperature: DataTypes.INTEGER,
    icon: DataTypes.STRING,
    userid: {
      type: DataTypes.INTEGER,
            foreignKey: true
    }
  },
    {
      classMethods: {
        associate: function(db) {
          Weather.hasMany(db.track);
        }
      }
    }
  );
  return Weather;
};