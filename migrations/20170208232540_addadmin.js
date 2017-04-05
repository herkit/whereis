
exports.up = function(knex, Promise) {
  var password = process.env.WHEREIS_ADMIN_PASSWORD || 'af039452va234';
  return Promise.all([
    knex('users').
    insert({ 
      username: 'admin', 
      password: password
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex('users').
    delete().
    where('username', 'admin')
  ])  
};
