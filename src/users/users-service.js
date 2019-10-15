const bcrypt = require('bcryptjs');
const xss = require('xss');

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const usersServices = {
  validatePassword(password) {
    if (password.length < 8) {
      return 'Password be longer than 8 characters';
    }
    if (password.length > 72) {
      return 'Password be less than 72 characters';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with empty spaces';
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'Password must contain 1 upper case, lower case, number and special character';
    }
    return null;
  },
  getUsers(knex) {
    return knex.from('users').select('*');
  },

  hasUserWithEmail(db, email) {
    return db('users')
      .where({ email })
      .first()
      .then(user => !!user);
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
  },

  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },

  serializeUser(user) {
    return {
      user_id: user.user_id,
      email: xss(user.email),
      weight: xss(user.weight),
      height: xss(user.height),
      age: xss(user.age),
      goals: xss(user.goals),
      gender: xss(user.gender),
      activity_lvl: xss(user.activity_lvl),
      protein: xss(user.protein),
      carbs: xss(user.carbs),
      fats: xss(user.fats)
    };
  }
};

module.exports = usersServices;
