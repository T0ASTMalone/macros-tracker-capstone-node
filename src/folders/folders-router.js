const path = require('path');
const express = require('express');
const xss = require('xss');
const foldersServices = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const sanitizeFolder = folder => ({
  id: folder.id,
  name: xss(folder.name)
});

foldersRouter
  .route('/')
  .get((req, res, next) => {
    const knex = req.app.get('db');
    foldersServices
      .getFolders(knex)
      .then(folders => {
        res.json(folders.map(folder => sanitizeFolder(folder)));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knex = req.app.get('db');
    const newFolder = req.body;
    console.log(newFolder);
    if (!newFolder) {
      return res
        .status(400)
        .json({ error: { message: `Missing newFolder in request body` } });
    }
    foldersServices
      .createFolder(knex, newFolder)
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${folder.id}`))
          .json(sanitizeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route('/:id')
  .all((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    foldersServices
      .getById(knex, id)
      .then(folder => {
        if (!folder) {
          return res
            .status(404)
            .json({ error: { message: `Folder not found` } });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizeFolder(res.folder));
  })
  .delete((req, res, next) => {
    const knex = req.app.get('db');
    const id = req.params.id;
    console.log(id);
    foldersServices
      .deleteFolder(knex, id)
      .then(() => {
        return res.status(204).end();
      })
      .catch(next);
  })
  .patch((req, res, next) => {
    const id = req.params.id;
    const newFolderName = req.body;
    if (!newFolderName) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a 'folder name'`
        }
      });
    }
    foldersServices
      .updateFolder(knex, id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;
