const path = require('path');
const express = require('express');
const xss = require('xss');
const mealsServices = require('./meals-service');
const foodsService = require('../foods/foods-service');

const mealsRouter = express.Router();
const jsonParser = express.json();

const sanitizeMeal = meal => ({
  meal_id: meal.meal_id,
  meal_name: xss(meal.meal_name),
  date_added: meal.date_added,
  protein: xss(meal.protein),
  carbs: xss(meal.carbs),
  fats: xss(meal.fats)
});

const serializeFood = food => ({
  food_id: food.id,
  food_name: xss(food.food_name),
  servings: xss(food.servings),
  date_added: food.date_added,
  meal_id: food.meal_id,
  protein: xss(food.protein),
  carbs: xss(food.carbs),
  fats: xss(food.fats)
});

mealsRouter
  .route('/')
  .get((req, res, next) => {
    const knex = req.app.get('db');
    mealsServices
      .getmeals(knex)
      .then(meals => {
        res.json(meals.map(meal => sanitizeMeal(meal)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const { user_id, meal_name, protein, carbs, fats } = req.body;
    const newMeal = { user_id, meal_name, protein, carbs, fats };
    console.log(newMeal);

    for (const [key, value] of Object.entries(newMeal)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    mealsServices
      .createMeal(knex, newMeal)
      .then(meal => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${meal.id}`))
          .json(sanitizeMeal(meal));
      })
      .catch(next);
  });

mealsRouter
  .route('/:id')
  .all((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    mealsServices
      .getById(knex, id)
      .then(meal => {
        if (!meal) {
          return res.status(404).json({ error: { message: `Meal not found` } });
        }
        console.log(meal);
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
    console.log(id);
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
    console.log(newMealInfo);
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
    console.log('ran');
    const knex = req.app.get('db');
    const id = req.params.id;
    mealsServices
      .getById(knex, id)
      .then(meal => {
        if (!meal) {
          return res.status(404).json({ error: { message: `Meal not found` } });
        }
        res.meal = meal.meal_id;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    const knex = req.app.get('db');
    foodsService.getMealFoods(knex, res.meal).then(foods => {
      res.json(foods.map(food => serializeFood(food)));
    });
  });

module.exports = mealsRouter;
