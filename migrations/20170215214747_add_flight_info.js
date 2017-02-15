
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('flights', function(table) {
      table.string('flightnumber');
      table.string('airline_code');
      table.string('airline_name');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('flights', function(table) {
      table.dropColumn('flightnumber');
      table.dropColumn('airline_code');
      table.dropColumn('airline_name');
    })
  ]);
};
