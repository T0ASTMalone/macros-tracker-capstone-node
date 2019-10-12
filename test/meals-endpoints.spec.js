const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');

describe.only('Meals Endpoints', () => {
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

  describe(`GET /api/meals`, () => {
    beforeEach('insert users and meals', () =>
      helpers.seedUsers(db, testUsers)
    );

    context(`Given there are no meals in the db`, () => {
      const testUser = testUsers[0];
      const user_id = testUser.user_id;
      const user = { user_id };

      it('GET /api/meals responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/meals')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(user)
          .expect(200, []);
      });
    });

    context('Given there are meals in the db', () => {
      beforeEach('insert meals', () => db.into('meal_log').insert(testMeals));
      const testUser = testUsers[0];
      const user_id = testUser.user_id;
      const user = { user_id };
      const userMeals = testMeals.filter(meal => meal.user_id === user_id);
      const expectedMeals = userMeals.map(meal =>
        helpers.makeExpectedMeal(testUser, meal)
      );
      it('GET /api/meals responds with 200 and the users meals', () => {
        return supertest(app)
          .get('/api/meals')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(user)
          .expect(200)
          .expect(expectedMeals);
      });
    });
  });

  describe('GET /api/meals/:id', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    context('Given there are no meals in the db', () => {
      const testUser = testUsers[0];

      it(`Responds with 404 meal not found`, () => {
        const mealId = 123;
        return supertest(app)
          .get(`/api/meals/${mealId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: `Meal not found` });
      });
    });

    context('Given there are meals in the db', () => {
      beforeEach('insert users', () => db.into('meal_log').insert(testMeals));

      const testUser = testUsers[0];

      it('Responds with 200 and a meal', () => {
        const mealId = 1;
        const expectedMeal = helpers.makeExpectedMeal(
          testUser,
          testMeals[mealId - 1]
        );
        return supertest(app)
          .get(`/api/meals/${mealId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedMeal);
      });

      it('Responds with 400 meal not found', () => {
        const mealId = 100;
        return supertest(app)
          .get(`/api/meals/${mealId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: `Meal not found` });
      });
    });

    context('Given an xss attack meal', () => {
      const testUser = testUsers[0];

      const { maliciousMeal, expectedMeal } = helpers.makeMaliciousMeal(
        testUser
      );
      console.log(maliciousMeal, expectedMeal);

      beforeEach('seed malicious meal', () => {
        db.into('meal_log').insert(maliciousMeal);
      });

      it(`removes xss attack content`, () => {
        return supertest(app)
          .get(`/api/meals/${maliciousMeal.meal_id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedMeal);
      });
    });
  });
});
