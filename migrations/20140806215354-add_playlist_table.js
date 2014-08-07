module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
  migration.createTable('playlists',
    {id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    tracks: DataTypes.TEXT,
    weatherId: DataTypes.INTEGER
    })
    .complete(done);
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('playlists')
      .complete(done);
  }
}
