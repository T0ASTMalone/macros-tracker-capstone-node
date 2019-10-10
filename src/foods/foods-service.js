const xss = require('xss');

const foodsServices = {
  getFoods(knex) {
    return knex.from('food_log').select('*');
  },

  getMealFoods(knex, meal_id) {
    return knex
      .from('food_log')
      .select('*')
      .where({ meal_id });
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
      .where({ id })
      .first();
  },

  deleteFood(knex, id) {
    return knex('food_log')
      .where({ id })
      .delete();
  },

  updateFood(knex, id, newFood) {
    return knex('food_log')
      .where({ id })
      .update(newFood);
  },

  serializeFood(food) {
    return {
      id: food.id,
      food_name: xss(food.food_name),
      servings: xss(food.servings),
      date_added: food.date_added,
      meal_id: food.meal_id,
      protein: xss(food.protein),
      carbs: xss(food.carbs),
      fats: xss(food.fats)
    };
  }
};

module.exports = foodsServices;
