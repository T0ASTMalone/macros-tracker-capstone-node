const path = require('path');
const express = require('express');
const xss = require('xss');
const mealsServices = require('./meals-service');
const foodsService = require('../foods/foods-service');
const { requireAuth } = require('../middleware/jwt-auth');

const mealsRouter = express.Router();
const jsonParser = express.json();

const sanitizeMeal = meal => ({
  user_id: meal.user_id,
  meal_id: meal.meal_id,
  meal_name: xss(meal.meal_name),
  date_added: meal.date_added.toISOString().slice(0, -5) + 'Z',
  protein: xss(meal.protein),
  carbs: xss(meal.carbs),
  fats: xss(meal.fats)
});

const serializeFood = food => ({
  id: food.id,
  food_name: xss(food.food_name),
  user_id: food.user_id,
  servings: xss(food.servings),
  date_added: food.date_added.toISOString().slice(0, -5) + 'Z',
  meal_id: food.meal_id,
  protein: xss(food.protein),
  carbs: xss(food.carbs),
  fats: xss(food.fats)
});

mealsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    const knex = req.app.get('db');
    const user_id = req.user.user_id;
    mealsServices
      .getAllUsrMeals(knex, user_id)
      .then(meals => {
        res.json(meals.map(meal => sanitizeMeal(meal)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const { user_id, meal_name, protein, carbs, fats } = req.body;
    const newMeal = { user_id, meal_name, protein, carbs, fats };

    for (const [key, value] of Object.entries(newMeal)) {
      if (value == null) {
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });
      }
    }

    mealsServices
      .createMeal(knex, newMeal)
      .then(meal => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${meal.meal_id}`))
          .json(sanitizeMeal(meal));
      })
      .catch(next);
  });

mealsRouter
  .route('/:id')
  .all(requireAuth)
  .all((req, res, next) => {
    const knex = req.app.get('db');
    const meal_id = req.params.id;
    mealsServices
      .getMealById(knex, meal_id)
      .then(meal => {
        if (!meal) {
          return res.status(404).json({ error: `Meal not found` });
        }
        res.meal = meal;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizeMeal(res.meal));
  })
  .delete((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    mealsServices
      .deleteMeal(knex, id)
      .then(() => {
        return res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    const newMealInfo = req.body;
    if (!newMealInfo) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a 'meal name'`
        }
      });
    }
    mealsServices
      .updateMeal(knex, id, newMealInfo)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

mealsRouter
  .route('/:id/foods')
  .all((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    mealsServices
      .getMealById(knex, id)
      .then(meal => {
        if (!meal) {
          return res.status(404).json({ error: `Meal not found` });
        }
        res.meal = meal.meal_id;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    const knex = req.app.get('db');
    mealsServices.getMealFoods(knex, res.meal).then(foods => {
      return res.status(200).json(foods.map(food => serializeFood(food)));
    });
  });

module.exports = mealsRouter;
