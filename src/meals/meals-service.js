const xss = require('xss');

const mealsServices = {
  getAllUsrMeals(knex, user_id) {
    return knex
      .from('meal_log')
      .select('*')
      .where({ user_id })
      .orderBy('date_added', 'desc');
  },

  getTodaysMeals(knex, user_id) {
    const where = `DATE_TRUNC('day',date_added) = CURRENT_DATE`;
    return knex
      .from('meal_log')
      .select('*')
      .whereRaw(where)
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
  },

  serializeMeal(meal) {
    return {
      user_id: meal.user_id,
      meal_id: meal.meal_id,
      meal_name: xss(meal.meal_name),
      date_added: meal.date_added.toISOString().slice(0, -5) + 'Z',
      protein: xss(meal.protein),
      carbs: xss(meal.carbs),
      fats: xss(meal.fats)
    };
  },

  serializeFood(food) {
    return {
      id: food.id,
      food_name: xss(food.food_name),
      user_id: food.user_id,
      servings: xss(food.servings),
      date_added: food.date_added.toISOString().slice(0, -5) + 'Z',
      meal_id: food.meal_id,
      protein: xss(food.protein),
      carbs: xss(food.carbs),
      fats: xss(food.fats)
    };
  },

  formatMealFoods(foods) {
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

  formatMeals(meals) {
    meals.map(meal => {
      const { protein, carbs, fats } = meal;
      const macros = { protein, fats, carbs };
      return Object.keys(macros).map(macro => {
        return macros[macro] ? macros[macro] : (meal[macro] = '0');
      });
    });
  }
};

module.exports = mealsServices;
