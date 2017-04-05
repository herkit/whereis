
exports.up = function(knex, Promise) {
  return knex.schema.createTable('flights', function(table) {
    table.increments('id');
    table.string('from_name');
    table.string('from_code');
    table.float('from_location_lat');
    table.float('from_location_lng');
    table.dateTime('from_time').defaultTo(knex.fn.now());
    table.string('to_name');
    table.string('to_code');
    table.float('to_location_lat');
    table.float('to_location_lng');
    table.dateTime('to_time').defaultTo(knex.fn.now());
    table.integer('createdby');
    table.timestamps();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('flights');
};
