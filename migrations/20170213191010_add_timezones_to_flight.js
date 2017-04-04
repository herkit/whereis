
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('flights', function(table) {
      table.integer('from_timezone_dstOffset');
      table.integer('from_timezone_rawOffset');
      table.string('from_timezone_timeZoneId');
      table.string('from_timezone_timeZoneName');
      table.string('from_timezone_status');
      table.integer('to_timezone_dstOffset');
      table.integer('to_timezone_rawOffset');
      table.string('to_timezone_timeZoneId');
      table.string('to_timezone_timeZoneName');
      table.string('to_timezone_status');
      table.renameColumn('createdby', 'created_by');
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('flights', function(table) {
      table.dropColumn('from_timezone_dstOffset');
      table.dropColumn('from_timezone_rawOffset');
      table.dropColumn('from_timezone_timeZoneId');
      table.dropColumn('from_timezone_timeZoneName');
      table.dropColumn('from_timezone_status');
      table.dropColumn('to_timezone_dstOffset');
      table.dropColumn('to_timezone_rawOffset');
      table.dropColumn('to_timezone_timeZoneId');
      table.dropColumn('to_timezone_timeZoneName');
      table.dropColumn('to_timezone_status');
      table.renameColumn('created_by', 'createdby');
    })
  ])
  
};
