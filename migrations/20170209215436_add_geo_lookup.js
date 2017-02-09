
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('geolookup', function(table) {
      table.increments('lookupid');
      table.float('latitude');
      table.float('longitude');
      table.string('house');
      table.string('street');
      table.string('settlement');
      table.string('district');
      table.string('district_long');
      table.string('state');
      table.string('state_long');
      table.string('country');
      table.string('country_long');
      table.string('postcode');
    }),
    knex.schema.table('gpslog', function(table) {
      table.integer('lookupid');
    })])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('gpslog', function(table) {
      table.dropColumn('lookupid');
    }),
    knex.schema.dropTable('geolookup')
  ])
};
