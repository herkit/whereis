// Update with your config settings.

console.log(process.env);

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './data/dev.sqlite3'
    }
  },

  production: {
    client: 'mysql',
    connection: {
      host:     'db',
      database: process.env.MYSQL_DATABASE,
      user:     process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
