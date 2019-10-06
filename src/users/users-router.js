const path = require('path');
const express = require('express');
const xss = require('xss');
const usersServices = require('./users-service');

const usersRouter = express.Router();
const jsonParser = express.json();

const sanitizeUser = user => ({
  user_id: user.user_id,
  email: xss(user.email),
  weight: xss(user.weight),
  height: xss(user.height),
  age: xss(user.age),
  goals: xss(user.goals),
  gender: xss(user.gender),
  activity_lvl: xss(user.activity_lvl),
  protein: xss(user.protein),
  carbs: xss(user.carbs),
  fats: xss(user.fats)
});

usersRouter
  .route('/')
  .get((req, res, next) => {
    const knex = req.app.get('db');
    usersServices
      .getUsers(knex)
      .then(users => {
        res.json(users.map(user => sanitizeUser(user)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const newUser = req.body;
    console.log(newUser);
    if (!newUser) {
      return res
        .status(400)
        .json({ error: { message: `Missing newUser in request body` } });
    }
    usersServices
      .createUser(knex, newUser)
      .then(user => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${user.id}`))
          .json(sanitizeUser(user));
      })
      .catch(next);
  });

usersRouter
  .route('/:id')
  .all((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    usersServices
      .getById(knex, id)
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: { message: `User not found` } });
        }
        res.user = user;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizeUser(res.user));
  })
  .delete((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    console.log(id);
    usersServices
      .deleteUser(knex, id)
      .then(() => {
        return res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    const newUserInfo = req.body;
    console.log(newUserInfo);
    if (!newUserInfo) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a 'user name'`
        }
      });
    }
    usersServices
      .updateUser(knex, id, newUserInfo)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = usersRouter;
