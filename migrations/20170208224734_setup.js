
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('users', function(table){
      table.increments('id');
      table.string('username');
      table.string('password');
      table.timestamps();
    }),
    knex.schema.createTable('gpslog', function(table){
      table.increments('logid');
      table.string('raw');
      table.dateTime('datetime');
      table.string('id');
      table.date('gps_date');
      table.time('gps_time');
      table.string('gps_signal');
      table.string('gps_fix');
      table.float('geo_latitude');
      table.float('geo_longitude');
      table.integer('geo_bearing');
      table.float('speed_kmh');
      table.float('speed_knots');
      table.float('speed_mph');
      table.string('checksum');
    })
  ])  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users'),
    knew.schema.dropTable('gpslog')
  ]);
};
