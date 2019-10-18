const xss = require('xss');

const foodsServices = {
  getUserFoods(knex, user_id) {
    return knex
      .from('food_log')
      .select('*')
      .where({ user_id });
  },

  createFood(knex, newFood) {
    return knex
      .from('food_log')
      .insert(newFood)
      .returning('*')
      .then(rows => rows);
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

  formatFoods(foods) {
    foods.map(food => {
      const { protein, carbs, fats } = food;
      const macros = { protein, fats, carbs };
      return Object.keys(macros).map(macro => {
        return macros[macro]
          ? (food[macro] = parseInt(food[macro]) / parseInt(food.servings))
          : (food[macro] = '0');
      });
    });
  },

  serializeFood(food) {
    return {
      id: food.id,
      user_id: food.user_id,
      meal_id: food.meal_id,
      food_name: xss(food.food_name),
      date_added: food.date_added.toISOString().slice(0, -5) + 'Z',
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servings: food.servings
    };
  }
};

module.exports = foodsServices;
