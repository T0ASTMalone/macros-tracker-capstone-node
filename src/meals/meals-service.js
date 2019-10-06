const mealsServices = {
  getmeals(knex) {
    return knex.from('meal_log').select('*');
  },

  createMeal(knex, newMeal) {
    return knex
      .from('meal_log')
      .insert(newMeal)
      .returning('*')
      .then(rows => rows[0]);
  },

  getById(knex, id) {
    return knex
      .from('meal_log')
      .select('*')
      .where('meal_id', id)
      .first();
  },

  deleteMeal(knex, id) {
    return knex('meal_log')
      .where('meal_id', id)
      .delete();
  },

  updateMeal(knex, id, newMeal) {
    return knex('meal_log')
      .where('meal_id', id)
      .update(newMeal);
  }
};

module.exports = mealsServices;
