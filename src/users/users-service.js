const usersServices = {
  getUsers(knex) {
    return knex.from('users').select('*');
  },

  createUser(knex, newUser) {
    return knex
      .from('users')
      .insert(newUser)
      .returning('*')
      .then(rows => rows[0]);
  },

  getById(knex, id) {
    return knex
      .from('users')
      .select('*')
      .where('user_id', id)
      .first();
  },

  deleteUser(knex, id) {
    return knex('users')
      .where('user_id', id)
      .delete();
  },

  updateUser(knex, id, newUser) {
    return knex('users')
      .where('user_id', id)
      .update(newUser);
  }
};

module.exports = usersServices;
