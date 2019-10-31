const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Foods Endpoints", () => {
  let db;

  const { testUsers, testMeals, testFoods } = helpers.makeMacroFyFixtures();

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe(`GET /api/foods/:id`, () => {
    const testUser = testUsers[0];
    const { maliciousMeal, expectedMeal } = helpers.makeMaliciousMeal(testUser);
    const { maliciousFood, expectedFood } = helpers.makeMaliciousFood(
      testUser,
      maliciousMeal.meal_id
    );
    context("Given there are no foods in the db", () => {
      beforeEach("seed users", () => helpers.seedUsers(db, testUsers));
      const testUser = testUsers[0];

      it("returns 404 food not found", () => {
        return supertest(app)
          .get("/api/foods/3")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(404, { error: "Food not found" });
      });
    });

    context("Given there are foods in the db", () => {
      beforeEach("seed tables", () =>
        helpers.seedMacroFyTables(db, testUsers, testMeals, testFoods)
      );

      it("responds with 200 and the specified food", () => {
        const foodId = testFoods[1].id;
        const testUser = testUsers[0];
        const expectedFood = helpers.makeExpectedFood(
          testUser,
          testFoods[foodId - 1].meal_id,
          testFoods[foodId - 1]
        );
        return supertest(app)
          .get(`/api/foods/${foodId}`)
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(200, expectedFood);
      });
    });

    context("Given an xss attack", () => {
      beforeEach("seed tables", () =>
        helpers.seedMacroFyTables(db, testUsers, [maliciousMeal], maliciousFood)
      );

      it("removes xss content", () => {
        const testUser = testUsers[0];

        return supertest(app)
          .get(`/api/foods/${maliciousFood[0].id}`)
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .send(testUser)
          .expect(200, expectedFood[0]);
      });
    });
  });

  describe(`POST /api/foods`, () => {
    context(`Food validation`, () => {
      beforeEach("insert users and meals", () =>
        helpers.seedMacroFyTables(db, testUsers, testMeals)
      );
      const requiredFields = [
        "meal_id",
        "user_id",
        "food_name",
        "servings",
        "protein",
        "carbs",
        "fats"
      ];

      const testUser = testUsers[0];

      requiredFields.forEach(field => {
        const foodsPostAttempt = [
          {
            meal_id: 1,
            user_id: 1,
            food_name: "test-food",
            servings: "2",
            protein: "2",
            carbs: "1",
            fats: "8"
          }
        ];

        it(`responds with 400 required error when '${field}' is missing`, () => {
          foodsPostAttempt.map(food => delete food[field]);
          return supertest(app)
            .post("/api/foods")
            .set("Authorization", helpers.makeAuthHeader(testUser))
            .send(foodsPostAttempt)
            .expect(400, {
              error: `Missing '${field}' in request body`
            });
        });
      });

      context("Happy path", () => {
        it(`responds with 201, serialized meal`, () => {
          const testFood = [
            {
              meal_id: 1,
              user_id: 1,
              food_name: "test-food",
              servings: "2",
              protein: "2",
              carbs: "1",
              fats: "8"
            }
          ];

          return supertest(app)
            .post("/api/foods")
            .set("Authorization", helpers.makeAuthHeader(testUser))
            .send(testFood)
            .expect(res => {
              expect(res.body[0]).to.have.property("id");
              expect(res.body[0].meal_id).to.eql(testFood[0].meal_id);
              expect(res.body[0].user_id).to.eql(testFood[0].user_id);
              expect(res.body[0].food_name).to.eql(testFood[0].food_name);
              expect(res.body[0].protein.toString(10)).to.eql(
                testFood[0].protein
              );
              expect(res.body[0].carbs.toString(10)).to.eql(testFood[0].carbs);
              expect(res.body[0].fats.toString(10)).to.eql(testFood[0].fats);
              expect(res.headers.location).to.eql(
                `/api/meals/${res.body[0].meal_id}/foods`
              );
            })
            .expect(res =>
              db
                .from("food_log")
                .select("*")
                .where("id", res.body[0].id)
                .first()
                .then(row => {
                  expect(row).to.have.property("id");
                  expect(row.food_name.toString(10)).to.eql(
                    testFood[0].food_name
                  );
                  expect(row.protein.toString(10)).to.eql(testFood[0].protein);
                  expect(row.carbs.toString(10)).to.eql(testFood[0].carbs);
                  expect(row.fats.toString(10)).to.eql(testFood[0].fats);
                })
            );
        });
      });
    });
  });

  describe(`GET /api/foods`, () => {
    beforeEach("insert users and meals", () =>
      helpers.seedMacroFyTables(db, testUsers, testMeals)
    );

    context(`Given there are no foods in the db`, () => {
      const testUser = testUsers[0];

      it("GET /api/foods responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/foods")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .send(testUser)
          .expect(200);
      });
    });

    context("Happy Path", () => {
      beforeEach("insert users and meals", () => {
        helpers.seedMacroFyTables(db, testUsers, testMeals);
      });

      it(`responds 201, serialized food`, () => {
        const testUser = testUsers[0];
        const newFood = [
          {
            meal_id: 1,
            food_name: "test-food",
            servings: "2",
            protein: "2",
            carbs: "1",
            fats: "8"
          }
        ];

        return supertest(app)
          .post("/api/foods")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .send(newFood)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property("id");
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
              .from("food_log")
              .select("*")
              .where("id", res.body.id)
              .first()
              .then(row => {
                expect(row).to.have.property("id");
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
