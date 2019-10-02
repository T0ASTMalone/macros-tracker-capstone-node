const notesServices = {
  getNotes(knex) {
    return knex.from('noteful_notes').select('*');
  },

  createNote(knex, newFolder) {
    return knex
      .from('noteful_notes')
      .insert(newFolder)
      .returning('*')
      .then(rows => rows[0]);
  },

  getById(knex, id) {
    return knex
      .from('noteful_notes')
      .select('*')
      .where('id', id)
      .first();
  },

  deleteNote(knex, id) {
    return knex('noteful_notes')
      .where({ id })
      .delete();
  },

  updateNote(knex, id, newNote) {
    return knex('noteful_notes')
      .where({ id })
      .update(newNote);
  }
};

module.exports = notesServices;
