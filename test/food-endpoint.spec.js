const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Foods Endpoints', () => {
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

  describe(`GET /api/foods/:id`, () => {
    const testUser = testUsers[0];
    const { maliciousMeal, expectedMeal } = helpers.makeMaliciousMeal(testUser);
    const { maliciousFood, expectedFood } = helpers.makeMaliciousFood(
      testUser,
      maliciousMeal.meal_id
    );
    context('Given there are no foods in the db', () => {
      beforeEach('seed users', () => helpers.seedUsers(db, testUsers));
      const testUser = testUsers[0];

      it('returns 404 food not found', () => {
        return supertest(app)
          .get('/api/foods/3')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: 'Food not found' });
      });
    });

    context('Given there are foods in the db', () => {
      beforeEach('seed tables', () =>
        helpers.seedMacroFyTables(db, testUsers, testMeals, testFoods)
      );

      it('responds with 200 and the specified food', () => {
        const foodId = testFoods[1].id;
        const testUser = testUsers[0];
        const expectedFood = helpers.makeExpectedFood(
          testUser,
          testFoods[foodId - 1].meal_id,
          testFoods[foodId - 1]
        );
        return supertest(app)
          .get(`/api/foods/${foodId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedFood);
      });
    });

    context('Given an xss attack', () => {
      beforeEach('seed tables', () =>
        helpers.seedMacroFyTables(db, testUsers, [maliciousMeal], maliciousFood)
      );

      it('removes xss content', () => {
        const testUser = testUsers[0];

        return supertest(app)
          .get(`/api/foods/${maliciousFood[0].id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(testUser)
          .expect(200, expectedFood[0]);
      });
    });
  });

  describe(`POST /api/foods`, () => {
    context(`Food validation`, () => {
      beforeEach('insert users and meals', () =>
        helpers.seedMacroFyTables(db, testUsers, testMeals)
      );
      const requiredFields = [
        'meal_id',
        'user_id',
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
            user_id: 1,
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
              user_id: 1,
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
              expect(res.body.user_id).to.eql(testFood[0].user_id);
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
      const testUser = testUsers[0];

      it('GET /api/foods responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/foods')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(testUser)
          .expect(200);
      });
    });
  });
});
