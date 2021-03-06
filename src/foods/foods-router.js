const path = require('path');
const express = require('express');
const foodsServices = require('./foods-service');
const jsonParser = express.json();
const foodsRouter = express.Router();
const { requireAuth } = require('../middleware/jwt-auth');

foodsRouter
  .route('/')
  .all(requireAuth)
  .get(jsonParser, (req, res, next) => {
    const userId = req.user.user_id;
    foodsServices
      .getUserFoods(req.app.get('db'), userId)
      .then(foods => {
        foodsServices.formatFoods(foods);
        return res.json(foods.map(food => foodsServices.serializeFood(food)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const foods = req.body;
    if (req.body.length < 1) {
      return res
        .status(400)
        .json({ error: `At leas one food should be included in a meal` });
    }

    let missingKeyError;
    foods.forEach(food => {
      const {
        user_id,
        food_name,
        servings,
        meal_id,
        protein,
        carbs,
        fats
      } = food;
      const newFood = {
        user_id,
        food_name,
        servings,
        meal_id,
        protein,
        carbs,
        fats
      };
      for (const [key, value] of Object.entries(newFood)) {
        if (value == null) {
          missingKeyError = `Missing '${key}' in request body`;
        }
      }
    });

    if (missingKeyError) {
      return res.status(400).json({ error: missingKeyError });
    }

    foodsServices
      .createFood(req.app.get('db'), foods)
      .then(createdFoods =>
        res
          .status(201)
          .location(
            path.posix.join(`/api/meals` + `/${foods[0].meal_id}/foods`)
          )
          .json(createdFoods.map(food => foodsServices.serializeFood(food)))
      )
      .catch(next);
  });

foodsRouter
  .route('/:id')
  .all(requireAuth)
  .all((req, res, next) => {
    const id = req.params.id;
    foodsServices
      .getById(req.app.get('db'), id)
      .then(food => {
        if (!food) {
          return res.status(404).json({ error: `Food not found` });
        }
        res.food = food;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    return res.status(200).json(foodsServices.serializeFood(res.food));
  })
  .delete((req, res, next) => {
    foodsServices
      .deleteFood(req.app.get('db'), req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    const newFood = req.body;
    const numOfValues = Object.values(newFood).filter(Boolean).length;
    if (numOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name', 'content' or 'folder_id'`
        }
      });
    }
    foodsServices
      .updateFood(knex, id, newFood)
      .then(food => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foodsRouter;
