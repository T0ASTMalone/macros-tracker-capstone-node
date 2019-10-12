const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');

describe('Foods Endpoints', () => {
  let db;

  const { testUsers, testMeals, testFoods } = helpers.makeMacroFyFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`POST /api/foods`, () => {
    context(`Food validation`, () => {
      beforeEach('insert users and meals', () =>
        helpers.seedMacroFyTables(db, testUsers, testMeals)
      );
      //add user_id to required field
      const requiredFields = [
        'meal_id',
        'food_name',
        'servings',
        'protein',
        'carbs',
        'fats'
      ];

      const testUser = testUsers[0];

      requiredFields.forEach(field => {
        //add user_id to required field
        const foodsPostAttempt = [
          {
            meal_id: 1,
            food_name: 'test-food',
            servings: '2',
            protein: '2',
            carbs: '1',
            fats: '8'
          }
        ];

        it(`responds with 400 required error when '${field}' is missing`, () => {
          foodsPostAttempt.map(food => delete food[field]);
          return supertest(app)
            .post('/api/foods')
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(foodsPostAttempt)
            .expect(400, {
              error: `Missing '${field}' in request body`
            });
        });
      });

      context('Happy path', () => {
        it(`responds with 201, serialized meal`, () => {
          const testFood = [
            {
              meal_id: 1,
              food_name: 'test-food',
              servings: '2',
              protein: '2',
              carbs: '1',
              fats: '8'
            }
          ];

          return supertest(app)
            .post('/api/foods')
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(testFood)
            .expect(res => {
              expect(res.body).to.have.property('id');
              expect(res.body.meal_id).to.eql(testFood[0].meal_id);
              expect(res.body.food_name).to.eql(testFood[0].food_name);
              expect(res.body.protein).to.eql(testFood[0].protein);
              expect(res.body.carbs).to.eql(testFood[0].carbs);
              expect(res.body.fats).to.eql(testFood[0].fats);
              expect(res.headers.location).to.eql(`/api/foods/${res.body.id}`);
            })
            .expect(res =>
              db
                .from('food_log')
                .select('*')
                .where('id', res.body.id)
                .first()
                .then(row => {
                  expect(res.body).to.have.property('id');
                  expect(res.body.food_name).to.eql(testFood[0].food_name);
                  expect(res.body.protein).to.eql(testFood[0].protein);
                  expect(res.body.carbs).to.eql(testFood[0].carbs);
                  expect(res.body.fats).to.eql(testFood[0].fats);
                })
            );
        });
      });
    });
  });

  describe(`GET /api/foods`, () => {
    beforeEach('insert users and meals', () =>
      helpers.seedMacroFyTables(db, testUsers, testMeals)
    );

    context(`Given there are no foods in the db`, () => {
      //alter foods table to have a foreign key that references the user_id
      const testUser = testUsers[0];
      const user_id = testUser.user_id;
      const user = { user_id };
      it('GET /api/foods responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/foods')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(user)
          .expect(200);
      });
    });
  });
});
