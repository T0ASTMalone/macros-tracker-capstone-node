const xss = require("xss");

const foodsServices = {
  getUserFoods(knex, user_id) {
    return knex
      .from("food_log")
      .select("*")
      .where({ user_id });
  },

  createFood(knex, newFood) {
    return knex
      .from("food_log")
      .insert(newFood)
      .returning("*")
      .then(rows => rows[0]);
  },

  getById(knex, id) {
    return knex
      .from("food_log")
      .select("*")
      .where({ id })
      .first();
  },

  deleteFood(knex, id) {
    return knex("food_log")
      .where({ id })
      .delete();
  },

  updateFood(knex, id, newFood) {
    return knex("food_log")
      .where({ id })
      .update(newFood);
  },

  serializeFood(food) {
    return {
      id: food.id,
      user_id: food.user_id,
      meal_id: food.meal_id,
      food_name: xss(food.food_name),
      date_added: food.date_added.toISOString().slice(0, -5) + "Z",
      protein: xss(food.protein),
      carbs: xss(food.carbs),
      fats: xss(food.fats),
      servings: xss(food.servings)
    };
  }
};

module.exports = foodsServices;
