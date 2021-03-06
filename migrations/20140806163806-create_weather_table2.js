module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('weathers',
      {id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      location: DataTypes.STRING,
      description: DataTypes.STRING,
      temperature: DataTypes.STRING,
      icon: DataTypes.STRING,
      userId: DataTypes.INTEGER
    })
    .complete(done);
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('users')
      .complete(done);
  }
}
