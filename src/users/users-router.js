const path = require('path');
const express = require('express');
const usersServices = require('./users-service');
const macrosService = require('./macros-service');
const { requireAuth } = require('../middleware/jwt-auth');

const usersRouter = express.Router();
const jsonParser = express.json();

usersRouter
  .route('/')
  .get((req, res, next) => {
    const knex = req.app.get('db');
    usersServices
      .getUsers(knex)
      .then(users => {
        res.json(users.map(user => usersServices.serializeUser(user)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const {
      email,
      password,
      weight,
      height,
      age,
      goals,
      gender,
      activity_lvl
    } = req.body;

    const userInfo = {
      email,
      password,
      weight,
      height,
      age,
      goals,
      gender,
      activity_lvl
    };

    if (!userInfo) {
      return res
        .status(400)
        .json({ error: { message: `Missing newUser in request body` } });
    }

    for (const [key, value] of Object.entries(userInfo)) {
      if (value == null) {
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });
      }
    }

    const passwordError = usersServices.validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    usersServices
      .hasUserWithEmail(knex, email)
      .then(hasUserWithEmail => {
        if (hasUserWithEmail) {
          return res.status(400).json({ error: `Email already taken` });
        }

        const userMacros = macrosService.calculateUserMacros(userInfo);

        return usersServices.hashPassword(password).then(hashPassword => {
          const newUser = {
            ...userInfo,
            password: hashPassword,
            ...userMacros
          };
          return usersServices.createUser(knex, newUser).then(user => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl + `/${user.user_id}`))
              .json(usersServices.serializeUser(user));
          });
        });
      })
      .catch(next);
  });

usersRouter
  .route('/:id')
  .all(requireAuth)
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
    res.json(usersServices.serializeUser(res.user));
  })
  .delete((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
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
