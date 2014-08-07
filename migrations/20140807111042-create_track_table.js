module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('tracks',
    {id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    trackName: DataTypes.STRING,
    artist: DataTypes.STRING,
    album: DataTypes.STRING,
    trackId: DataTypes.STRING,
    icon: DataTypes.STRING,
    weatherId: DataTypes.INTEGER
    })
    .complete(done);
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('tracks')
      .complete(done);
  }
}
