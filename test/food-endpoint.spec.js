const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');

describe.only('Users Endpoints', function() {
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

  describe.only(`POST /api/foods`, () => {
    context.only(`Meal validation`, () => {
      beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

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
    });
  });
});
