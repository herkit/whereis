
exports.up = function(knex, Promise) {
  return Promise.all([
    knex('users').
    insert({ 
      username: 'admin', 
      password: 'admin' 
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
