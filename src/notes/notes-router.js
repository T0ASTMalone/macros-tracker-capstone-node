const path = require('path');
const express = require('express');
const knex = require('knex');
const xss = require('xss');
const notesServices = require('./notes-service');
const jsonParser = express.json();

const notesRouter = express.Router();

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  content: xss(note.content),
  date_modified: note.date_modified,
  folderId: note.folderid
});
notesRouter
  .route('/')
  .get((req, res, next) => {
    notesServices
      .getNotes(req.app.get('db'))
      .then(notes => res.json(notes.map(note => serializeNote(note))))
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folderId } = req.body;
    const newNote = { name, content, folderid: folderId };

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null)
        return res
          .status(400)
          .json({ error: { message: `Missing ${key} in request body` } });
    }
    notesServices
      .createNote(req.app.get('db'), newNote)
      .then(note =>
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${note.id}`))
          .json(serializeNote(note))
      )
      .catch(next);
  });

notesRouter
  .route('/:id')
  .all((req, res, next) => {
    const id = req.params.id;
    notesServices
      .getById(req.app.get('db'), id)
      .then(note => {
        if (!note) {
          return res.status(404).json({ error: { message: `Note not found` } });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.status(200).json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    notesServices
      .deleteNote(req.app.get('db'), req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch((req, res, next) => {
    const { name, content, folder_id } = req.body;
    const newNote = { name, content, folder_id };
    const numOfValues = Object.values(newNote).filter(Boolean).length;
    if (numOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name', 'content' or 'folder_id'`
        }
      });
    }

    notesServices
      .updateNote(req.app.get('db'), newNote)
      .then(note => res.status(204).catch(next));
  });

module.exports = notesRouter;
