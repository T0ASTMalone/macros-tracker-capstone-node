const foodsServices = {
  getFoods(knex) {
    return knex.from('food_log').select('*');
  },

  getMealFoods(knex, mealId) {
    return knex
      .from('food_log')
      .select('*')
      .where('meal_id', mealId);
  },

  createFood(knex, newFood) {
    return knex
      .from('food_log')
      .insert(newFood)
      .returning('*')
      .then(rows => rows[0]);
  },

  getById(knex, id) {
    return knex
      .from('food_log')
      .select('*')
      .where('id', id)
      .first();
  },

  deleteFood(knex, id) {
    return knex('food_log')
      .where('id', id)
      .delete();
  },

  updateFood(knex, id, newFood) {
    return knex('food_log')
      .where('id', id)
      .update(newFood);
  }
};

module.exports = foodsServices;
