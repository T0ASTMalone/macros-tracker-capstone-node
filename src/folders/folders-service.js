const foldersServices = {
  getFolders(knex) {
    return knex.from('noteful_folders').select('*');
  },

  createFolder(knex, newFolder) {
    return knex
      .from('noteful_folders')
      .insert(newFolder)
      .returning('*')
      .then(rows => rows[0]);
  },

  getById(knex, id) {
    return knex
      .from('noteful_folders')
      .select('*')
      .where('id', id)
      .first();
  },

  deleteFolder(knex, id) {
    return knex('noteful_folders')
      .where({ id })
      .delete();
  },

  updateFolder(knex, id, newFolder) {
    return knex('noteful_folders')
      .where({ id })
      .update(newFolder);
  }
};

module.exports = foldersServices;
