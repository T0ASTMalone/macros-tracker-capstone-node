const mealsServices = {
  getAllUsrMeals(knex, user_id) {
    return knex
      .from('meal_log')
      .select('*')
      .where({ user_id });
  },

  getTodaysMeals(knex, user_id) {
    const where = `date_added > now()::date-365`;
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
  formatMealFoods(foods) {
    foods.map(food => {
      const { protein, carbs, fats } = food;
      const macros = { protein, fats, carbs };
      return Object.keys(macros).map(macro => {
        return macros[macro] ? macros[macro] : (food[macro] = '0');
      });
    });
  },

  formatMeals(meals) {
    meals.map(meal => {
      const { protein, carbs, fats } = meal;
      const macros = { protein, fats, carbs };
      return Object.keys(macros).map(macro => {
        console.log(meal[macro]);
        return macros[macro] ? macros[macro] : (meal[macro] = '0');
      });
    });
  }
};

module.exports = mealsServices;
