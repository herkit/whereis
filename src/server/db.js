var config = require('../../knexfile.js'),
    env = process.env.NODE_ENV || 'development',
    knex = require('knex')(config[env]);

function init() {
  return knex.migrate.latest([config]);
}

module.exports = knex;
module.exports.init = init;