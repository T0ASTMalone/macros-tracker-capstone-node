const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');

describe('Users Endpoints', function() {
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

  describe(`POST /api/meals`, () => {
    context(`Meal validation`, () => {
      beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

      const requiredFields = [
        'user_id',
        'meal_name',
        'protein',
        'carbs',
        'fats'
      ];

      const testUser = testUsers[0];

      requiredFields.forEach(field => {
        const mealPostAttempt = {
          user_id: 1,
          meal_name: 'test-meal',
          protein: '20',
          carbs: '10',
          fats: '8'
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete mealPostAttempt[field];

          return supertest(app)
            .post('/api/meals')
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(mealPostAttempt)
            .expect(400, {
              error: `Missing '${field}' in request body`
            });
        });
      });

      context('Happy path', () => {
        it(`responds 201, serialized meal`, () => {
          const newMeal = {
            user_id: 1,
            meal_name: 'test-meal',
            protein: '20',
            carbs: '10',
            fats: '8'
          };

          return supertest(app)
            .post('/api/meals')
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(newMeal)
            .expect(201)
            .expect(res => {
              expect(res.body).to.have.property('meal_id');
              expect(res.body.user_id).to.eql(newMeal.user_id);
              expect(res.body.meal_name).to.eql(newMeal.meal_name);
              expect(res.body.protein).to.eql(newMeal.protein);
              expect(res.body.carbs).to.eql(newMeal.carbs);
              expect(res.body.fats).to.eql(newMeal.fats);
              expect(res.headers.location).to.eql(
                `/api/meals/${res.body.meal_id}`
              );
            })
            .expect(res =>
              db
                .from('meal_log')
                .select('*')
                .where('meal_id', res.body.meal_id)
                .first()
                .then(row => {
                  expect(res.body).to.have.property('meal_id');
                  expect(res.body.meal_name).to.eql(newMeal.meal_name);
                  expect(res.body.protein).to.eql(newMeal.protein);
                  expect(res.body.carbs).to.eql(newMeal.carbs);
                  expect(res.body.fats).to.eql(newMeal.fats);
                })
            );
        });
      });
    });
  });
});
