const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe('Auth Endpoints', function() {
  let db;

  const { testUsers } = helpers.makeMacroFyFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`POST /api/auth/login`, () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['email', 'password'];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        email: testUser.email,
        password: testUser.password
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing '${field}' in request body`
          });
      });
    });
    it(`responds 400 'invalid email or password' when bad email`, () => {
      const userInvalidUser = { email: 'email-not', password: 'existy' };
      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidUser)
        .expect(400, { error: `Incorrect email or password` });
    });
    it(`responds 400 'invalid email or password' when bad password`, () => {
      const userInvalidPass = {
        email: testUser.email,
        password: 'incorrect'
      };
      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidPass)
        .expect(400, { error: `Incorrect email or password` });
    });

    it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
      const userValidCreds = {
        email: testUser.email,
        password: testUser.password
      };
      const expectedToken = jwt.sign(
        { user_id: testUser.user_id },
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256'
        }
      );
      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200)
        .expect(res => {
          expect(res.body.authToken).to.eql(expectedToken);
          expect(res.body.payload.user_id).to.eql(testUser.user_id);
        });
    });
  });

  describe(`POST /api/auth/refresh`, () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    it(`responds 200 and JWT auth token using secret`, () => {
      const expectedToken = jwt.sign(
        { user_id: testUser.user_id },
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256'
        }
      );
      return supertest(app)
        .post('/api/auth/refresh')
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .expect(200)
        .expect(res => {
          expect(res.body.authToken).to.eql(expectedToken);
          expect(res.body.payload.user_id).to.eql(testUser.user_id);
        });
    });
  });
});
