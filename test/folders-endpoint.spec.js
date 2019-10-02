const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');

const { makeFolders, makeMaliciousFolders } = require('./folders-fixtures');

describe.only(`Folders Endpoints`, () => {
  let db;

  before(() => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after(`Disconnect from db`, () => db.destroy());

  before(`clean table`, () =>
    db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE')
  );

  afterEach(`clean table`, () =>
    db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE')
  );

  describe(`GET /api/folders`, () => {
    context(`Given there are no folders in the db`, () => {
      it(`GET /api/folders responds with 200 and an empty array`, () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });

    context(`Given there are folders in the db`, () => {
      const folders = makeFolders();
      beforeEach(() => db.into('noteful_folders').insert(folders));

      it(`GET /api/folders responds with 200 and all the folders`, () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, folders);
      });
    });
  });

  describe(`GET /api/folders/:id`, () => {
    context(`Given there are no folders in the db`, () => {
      it(`GET /api/folders/:id responds with 404 folder not found`, () => {
        const folderId = 1;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder not found` } });
      });
    });

    context(`Given there are folders in the db`, () => {
      const folders = makeFolders();
      beforeEach(() => db.into('noteful_folders').insert(folders));

      it(`GET /api/folders responds with 200 and all the folders`, () => {
        const folderId = 1;
        const expected = folders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expected);
      });
    });
  });

  describe(`POST /api/folders`, () => {
    it(`POST /api/folders responds with and a new folder`, () => {
      const testFolder = {
        folder_name: 'New Test Folder'
      };
      return supertest(app)
        .post('/api/folders')
        .send(testFolder)
        .expect(res => {
          expect(res.body).to.have.property('id');
          expect(res.body.folder_name).to.eql(testFolder.folder_name);
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/folders/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    it(`removes xss content`, () => {
      const { maliciousFolders, expectedFolders } = makeMaliciousFolders();
      return supertest(app)
        .post(`/api/folders`)
        .send(maliciousFolders)
        .expect(201)
        .expect(res => {
          expect(res.body.folder_name).to.eql(expectedFolders.folder_name);
        });
    });
  });

  describe(`DELETE /api/folders/:id`, () => {
    context(`Given there are folders in the db`, () => {
      const testFolders = makeFolders();

      beforeEach('insert folders', () =>
        db.into('noteful_folders').insert(testFolders)
      );

      it(`Responds with 204 removed article`, () => {
        const id = 2;
        const expectedFolders = testFolders.filter(folder => folder.id !== id);
        return supertest(app)
          .delete(`/api/folders/${id}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/Folders`)
              .expect(expectedFolders);
          });
      });
    });

    context(`Given there are no folders in the db`, () => {
      it(`Responds with 404 folders not found`, () => {
        const id = 123456;
        return supertest(app)
          .delete(`/api/folders/${id}`)
          .expect(404, { error: { message: `Folder not found` } });
      });
    });
  });
});
