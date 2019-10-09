const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');

describe('Users Endpoints', function() {
  let db;

  const { testUsers } = helpers.makeMacroFyFixtures();

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

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

      const requiredFields = [
        'email',
        'password',
        'weight',
        'height',
        'age',
        'goals',
        'gender',
        'activity_lvl'
      ];
      const testUser = testUsers[0];

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          email: 'testemail@testmail.com',
          password: 'TestPassw0rd!',
          weight: '77.11',
          height: '172.72',
          age: '24',
          goals: 'gain',
          gender: 'male',
          activity_lvl: '1.55'
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`
            });
        });

        it(`responds 400 'Password be longer than 8 characters' when empty password`, () => {
          const userShortPassword = {
            email: 'testemail@testmail.com',
            password: '1234567',
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(userShortPassword)
            .expect(400, { error: `Password be longer than 8 characters` });
        });

        it(`responds 400 'Password be less than 72 characters' when long password`, () => {
          const userLongPassword = {
            email: 'testemail@testmail.com',
            password: '*'.repeat(73),
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(userLongPassword)
            .expect(400, { error: `Password be less than 72 characters` });
        });

        it(`responds 400 error when password starts with spaces`, () => {
          const userPasswordStartsSpaces = {
            email: 'testemail@testmail.com',
            password: ' 1Aa!2Bb@',
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(userPasswordStartsSpaces)
            .expect(400, {
              error: `Password must not start or end with empty spaces`
            });
        });

        it(`responds 400 error when password ends with spaces`, () => {
          const userPasswordEndsSpaces = {
            email: 'testemail@testmail.com',
            password: '1Aa!2Bb@ ',
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(userPasswordEndsSpaces)
            .expect(400, {
              error: `Password must not start or end with empty spaces`
            });
        });

        it(`responds 400 error when password isn't complex enough`, () => {
          const userPasswordNotComplex = {
            email: 'testemail@testmail.com',
            password: '11AAaabb',
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(userPasswordNotComplex)
            .expect(400, {
              error: `Password must contain 1 upper case, lower case, number and special character`
            });
        });

        it(`responds 400 'Email already taken' when email isn't unique`, () => {
          const duplicateUser = {
            email: testUser.email,
            password: 'TestPassw0rd!',
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(duplicateUser)
            .expect(400, { error: `Email already taken` });
        });
      });
      context(`Happy path`, () => {
        it(`responds 201, serialized user, storing bcryped password`, () => {
          const newUser = {
            email: 'testemail@testemail.com',
            password: 'TestPassw0rd!',
            weight: '77.11',
            height: '172.72',
            age: '24',
            goals: 'gain',
            gender: 'male',
            activity_lvl: '1.55'
          };
          return supertest(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(newUser)
            .expect(201)
            .expect(res => {
              expect(res.body).to.have.property('user_id');
              expect(res.body.email).to.eql(newUser.email);
              expect(res.body.weight).to.eql(newUser.weight);
              expect(res.body.height).to.eql(newUser.height);
              expect(res.body.age).to.eql(newUser.age);
              expect(res.body.goals).to.eql(newUser.goals);
              expect(res.body.gender).to.eql(newUser.gender);
              expect(res.body.activity_lvl).to.eql(newUser.activity_lvl);
              expect(res.body).to.not.have.property('password');
              expect(res.headers.location).to.eql(
                `/api/users/${res.body.user_id}`
              );
            })
            .expect(res =>
              db
                .from('users')
                .select('*')
                .where('user_id', res.body.user_id)
                .first()
                .then(row => {
                  expect(row.email).to.eql(newUser.email);
                  return bcrypt.compare(newUser.password, row.password);
                })
                .then(compareMatch => {
                  expect(compareMatch).to.be.true;
                })
            );
        });
      });
    });
  });
});
