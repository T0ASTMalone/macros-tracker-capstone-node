const path = require('path');
const express = require('express');
const knex = require('knex');
const xss = require('xss');
const foodsServices = require('./foods-service');
const jsonParser = express.json();
const foodsRouter = express.Router();

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

foodsRouter
  .route('/')
  .get((req, res, next) => {
    foodsServices
      .getFoods(req.app.get('db'))
      .then(foods => res.json(foods.map(food => serializeFood(food))))
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { food_name, servings, meal_id, protein, carbs, fats } = req.body;
    const newFood = { food_name, servings, meal_id, protein, carbs, fats };
    for (const [key, value] of Object.entries(newFood)) {
      if (value == null)
        return res
          .status(400)
          .json({ error: { message: `Missing ${key} in request body` } });
    }
    foodsServices
      .createFood(req.app.get('db'), newFood)
      .then(food =>
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${food.id}`))
          .json(serializeFood(food))
      )
      .catch(next);
  });

foodsRouter
  .route('/:id')
  .all((req, res, next) => {
    const id = req.params.id;
    foodsServices
      .getById(req.app.get('db'), id)
      .then(food => {
        if (!food) {
          return res.status(404).json({ error: { message: `Food not found` } });
        }
        res.food = food;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.status(200).json(serializeFood(res.food));
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
