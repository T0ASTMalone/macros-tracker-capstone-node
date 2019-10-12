const mealsServices = {
  getAllUsrMeals(knex, user_id) {
    return knex
      .from('meal_log')
      .select('*')
      .where({ user_id });
  },

  createMeal(knex, newMeal) {
    return knex
      .from('meal_log')
      .insert(newMeal)
      .returning('*')
      .then(rows => rows[0]);
  },

  getMealById(knex, meal_id) {
    return knex
      .from('meal_log')
      .select('*')
      .where({ meal_id })
      .first();
  },

  deleteMeal(knex, meal_id) {
    return knex('meal_log')
      .where({ meal_id })
      .delete();
  },

  updateMeal(knex, meal_id, newMeal) {
    return knex('meal_log')
      .where({ meal_id })
      .update(newMeal);
  },

  getMealFoods(knex, meal_id) {
    return knex('food_log')
      .select('*')
      .where({ meal_id });
  }
};

module.exports = mealsServices;
