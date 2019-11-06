const path = require("path");
const express = require("express");
const mealsServices = require("./meals-service");
const { requireAuth } = require("../middleware/jwt-auth");

const mealsRouter = express.Router();
const jsonParser = express.json();

mealsRouter
  .route("/")
  .all(requireAuth)
  .get((req, res, next) => {
    const knex = req.app.get("db");
    const user_id = req.user.user_id;
    mealsServices
      .getAllUsrMeals(knex, user_id)
      .then(meals => {
        mealsServices.formatMeals(meals);
        return res.json(meals.map(meal => mealsServices.serializeMeal(meal)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knex = req.app.get("db");
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
          .json(mealsServices.serializeMeal(meal));
      })
      .catch(next);
  });

mealsRouter
  .route("/:id")
  .all(requireAuth)
  .all((req, res, next) => {
    const knex = req.app.get("db");
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
    res.json(mealsServices.serializeMeal(res.meal));
  })
  .delete((req, res, next) => {
    const knex = req.app.get("db");
    const id = req.params.id;
    mealsServices
      .deleteMeal(knex, id)
      .then(() => {
        return res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knex = req.app.get("db");
    const id = req.params.id;
    const newMealInfo = req.body;
    console.log('new meal info: ', newMealInfo);
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
  .route("/:id/foods")
  .all((req, res, next) => {
    const knex = req.app.get("db");
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
    const knex = req.app.get("db");
    mealsServices.getMealFoods(knex, res.meal).then(foods => {
      mealsServices.formatMealFoods(foods);
      return res
        .status(200)
        .json(foods.map(food => mealsServices.serializeFood(food)));
    });
  });

mealsRouter.route("/:id/today").get((req, res, next) => {
  const user_id = req.params.id;
  const knex = req.app.get("db");
  mealsServices
    .getTodaysMeals(knex, user_id)
    .then(meals => {
      mealsServices.formatMeals(meals);
      return res.json(meals.map(meal => mealsServices.serializeMeal(meal)));
    })
    .catch(next);
});

module.exports = mealsRouter;
