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
    context(`Meal validation`, () => {
      beforeEach('insert users and meals', () => {
        helpers.seedMacroFyTables(db, testUsers, testMeals);
      });

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

    context('Happy Path', () => {
      beforeEach('insert users and meals', () => {
        helpers.seedMacroFyTables(db, testUsers, testMeals);
      });

      it(`responds 201, serialized food`, () => {
        const testUser = testUsers[0];
        const newFood = [
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
          .send(newFood)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property('id');
            expect(res.body.meal_id).to.eql(newFood[0].meal_id);
            expect(res.body.food_name).to.eql(newFood[0].food_name);
            expect(res.body.servings).to.eql(newFood[0].servings);
            expect(res.body.protein).to.eql(newFood[0].protein);
            expect(res.body.carbs).to.eql(newFood[0].carbs);
            expect(res.body.fats).to.eql(newFood[0].fats);
            expect(res.headers.location).to.eql(`/api/foods/${res.body.id}`);
          })
          .expect(res =>
            db
              .from('food_log')
              .select('*')
              .where('id', res.body.id)
              .first()
              .then(row => {
                expect(row).to.have.property('id');
                expect(row.food_name).to.eql(newFood[0].food_name);
                expect(row.servings).to.eql(parseInt(newFood[0].servings));
                expect(row.protein).to.eql(parseInt(newFood[0].protein));
                expect(row.carbs).to.eql(parseInt(newFood[0].carbs));
                expect(row.fats).to.eql(parseInt(newFood[0].fats));
              })
          );
      });
    });
  });
});
