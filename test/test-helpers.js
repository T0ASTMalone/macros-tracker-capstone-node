const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
  return [
    {
      user_id: 1,
      email: 'test-user-1@test-mail.com',
      password: 'password',
      weight: '170',
      height: '172',
      age: '24',
      goals: 'gain',
      gender: 'male',
      activity_lvl: 'active',
      protein: '170',
      carbs: '432',
      fats: '68'
    },
    {
      user_id: 2,
      email: 'test-user-2@test-mail.com',
      password: 'notapassowrd',
      weight: '160',
      height: '168',
      age: '24',
      goals: 'lose',
      gender: 'female',
      activity_lvl: 'active',
      protein: '160',
      carbs: '230',
      fats: '68'
    },
    {
      user_id: 3,
      email: 'test-user-3@test-mail.com',
      password: 'thisisapassword',
      weight: '150',
      height: '172',
      age: '21',
      goals: 'gain',
      gender: 'female',
      activity_lvl: 'active',
      protein: '150',
      carbs: '363',
      fats: '60'
    },
    {
      user_id: 4,
      email: 'test-user-4@test-mail.com',
      password: 'totalynotapassword',
      weight: '170',
      height: '175',
      age: '27',
      goals: 'gain',
      gender: 'male',
      activity_lvl: 'sedentary',
      protein: '170',
      carbs: '360',
      fats: '70'
    }
  ];
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.user_id }, secret, {
    subject: user.email,
    algorithm: 'HS256'
  });
  return `Bearer ${token}`;
}

function makeMealsArray() {
  return [
    {
      user_id: 1,
      meal_id: 1,
      meal_name: 'First test meal',
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 30,
      carbs: 10,
      fats: 15
    },
    {
      user_id: 2,
      meal_id: 2,
      meal_name: 'Second test meal',
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 10,
      carbs: 60,
      fats: 20
    },
    {
      user_id: 3,
      meal_id: 3,
      meal_name: 'Third test meal',
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 20,
      carbs: 50,
      fats: 10
    },
    {
      user_id: 4,
      meal_id: 4,
      meal_name: 'Fourth test meal',
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 30,
      carbs: 10,
      fats: 40
    }
  ];
}

function makeFoodArray(users, meals) {
  return [
    {
      id: 1,
      food_name: 'First test food!',
      meal_id: meals[0].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 10,
      carbs: 20,
      fats: 40,
      servings: 3
    },
    {
      id: 2,
      food_name: 'Second test food!',
      meal_id: meals[0].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 12,
      carbs: 6,
      fats: 10,
      servings: 2
    },
    {
      id: 3,
      food_name: 'Third test food!',
      meal_id: meals[0].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 6,
      carbs: 4,
      fats: 1,
      servings: 1
    },
    {
      id: 4,
      food_name: 'Fourth test food!',
      meal_id: meals[0].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 10,
      carbs: 4,
      fats: 20,
      servings: 1
    },
    {
      id: 5,
      food_name: 'Fifth test food!',
      meal_id: meals[meals.length - 1].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 7,
      carbs: 20,
      fats: 10,
      servings: 3
    },
    {
      id: 6,
      food_name: 'Sixth test food!',
      meal_id: meals[meals.length - 1].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 5,
      carbs: 10,
      fats: 14,
      servings: 3
    },
    {
      id: 7,
      food_name: 'Seventh test food!',
      meal_id: meals[3].meal_id,
      date_added: new Date('2029-01-22T16:28:32.615Z'),
      protein: 3,
      carbs: 21,
      fats: 0,
      servings: 4
    }
  ];
}

function makeExpectedMeal(users, meal) {
  return {
    user_id: users.user_id,
    meal_id: meal.meal_id,
    meal_name: meal.meal_name,
    date_added: meal.date_added.toISOString(),
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats
  };
}

function makeExpectedMealFoods(users, mealId, foods) {
  const expectedFoods = foods.filter(food => food.meal_id === mealId);

  return expectedFoods.map(food => {
    return {
      id: food.id,
      date_added: food.date_added.toISOString(),
      food_name: food.food_name,
      meal_id: food.meal_id,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servings: food.servings
    };
  });
}

function makeMaliciousMeal(user) {
  const maliciousMeal = {
    meal_id: 911,
    date_added: new Date(),
    meal_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    user_id: user.user_id,
    protein: '9',
    carbs: '10',
    fats: '0'
  };
  const expectedMeal = {
    ...makeExpectedMeal([user], maliciousMeal),
    meal_name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
  };
  return {
    maliciousMeal,
    expectedMeal
  };
}

function makeMacroFyFixtures() {
  const testUsers = makeUsersArray();
  const testMeals = makeMealsArray(testUsers);
  const testFoods = makeFoodArray(testUsers, testMeals);
  return { testUsers, testMeals, testFoods };
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx
      .raw(
        `TRUNCATE
        users,
        meal_log,
        food_log
      `
      )
      .then(() =>
        Promise.all([
          trx.raw(
            `ALTER SEQUENCE meal_log_meal_id_seq minvalue 0 START WITH 1`
          ),
          trx.raw(`ALTER SEQUENCE users_user_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE food_log_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('meal_log_meal_id_seq', 0)`),
          trx.raw(`SELECT setval('users_user_id_seq', 0)`),
          trx.raw(`SELECT setval('food_log_id_seq', 0)`)
        ])
      )
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }));
  return db
    .into('users')
    .insert(preppedUsers)
    .then(() =>
      db.raw(`SELECT setval('users_user_id_seq', ?)`, [
        users[users.length - 1].user_id
      ])
    );
}

function seedMacroFyTables(db, users, meals, foods = []) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async trx => {
    await seedUsers(trx, users);
    await trx.into('meal_log').insert(meals);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('meal_log_meal_id_seq', ?)`, [
      meals[meals.length - 1].meal_id
    ]);
    // only insert comments if there are some, also update the sequence counter
    if (foods.length) {
      await trx.into('food_log').insert(foods);
      await trx.raw(`SELECT setval('food_log_id_seq', ?)`, [
        foods[foods.length - 1].id
      ]);
    }
  });
}

function seedMaliciousMeal(db, user, meal) {
  return seedUsers(db, [user]).then(() => db.into('meal_log').insert([meal]));
}

module.exports = {
  makeUsersArray,
  makeMealsArray,
  makeExpectedMeal,
  makeExpectedMealFoods,
  makeMaliciousMeal,
  makeFoodArray,

  makeMacroFyFixtures,
  cleanTables,
  seedMacroFyTables,
  seedMaliciousMeal,
  makeAuthHeader,
  seedUsers
};
