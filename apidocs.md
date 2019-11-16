**MacroFy API Docs**

An api for calculating a users daily macro nutrients and logging user foods and meals and keep track of their food intake from day to day.

Responds with JSON

**Authentication**

- json web tokens

**POST /users**

A users macors are calculated using the following information using the Mifflin-St. Jeor equation:

    Men: calories/day = 10 x weight (kg) + 6.25 x height (cm) – 5 x age (y) + 5
    Women: calories/day = 10 x weight (kg) + 6.25 x height (cm) – 5 x age (y) – 161

Register a new user by providing a valid user with the following information

    const newUser = {
        email: "example@email.com" ,
        password: "examplePassword1!,
        age: 24,
        gender: "male",
        height: 172, *
        weight: 77.11, *
        goals: "gain",
        activity_lvl: "1.2" *
    };

\*Height should be converted to cm and weight to kg

\*Activity level should be one of the following values:

- 1.2 (Sedentary)

  Little or no exercise, desk job

- 1.375 (Lightly active)

  Light exercise/sports 1-3 days/week

- 1.55 (Moderately active)

  Moderate exercise/sports 6-7 days

- 1.725 (Very Active)

  Hard exercise every day, or 2 xs/day

- 1.9 (Extra active)

  Hard exercise 2 or more times per day

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/users”, {
        method: ‘POST’,
        headers: {
            "content-type": "application/json",
        }
        body: JSON.stringify(newUser),
    });

**Example response**

    {
        user_id: 1,
        email: "example@email.com" ,
        age: 24,
        gender: "male",
        height: 172,
        weight: 77.11,
        goals: "gain",
        activity_lvl: "1.2"
        macros:
            {
                protein: 170,
                carbs: 300,
                fats: 68
            }
    }

Macro nutrients are in grams

**POST auth/login**

Log in with valid credentials

**Example request**

    fetch(`https://fast-gorge-81708.herokuapp.com/api/auth/login`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(credentials)
    });

Credentials should contain the following:

    const credentials = {
        email: "valid@email.com",
        password: "validPassword1!"
    };

**GET /meals**

Get all the users meals by providing the user id

**Example request:**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals”, {
        method: ‘GET’,
        headers: {
            authorization: ‘bearer [authorization token]’
        },
        user: [user id],
    });

**Example response:**

    [
        {
            carbs: "58"
            date_added: "2019-11-09T17:11:02Z"
            fats: "1"
            meal_id: 84
            meal_name: "example meal"
            protein: "20"
            user_id: 5
        },
        {
            carbs: "60"
            date_added: "2019-11-09T02:19:38Z"
            fats: "0"
            meal_id: 83
            meal_name: "example meal 2"
            protein: "0"
            user_id: 5
        }
    ]

**POST /meals**

Post new meal to users log

New meals should include the following:

    const newMeal = {
        user_id,
        meal_name,
        protein,
        carbs,
        fats
    };

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals”, {
        method: ‘POST’,
        headers: {
            "content-type": "application/json",
            authorization: ‘bearer [authorization token]’
        },
        body: JSON.stringify([meal])
    });

**GET /meals/:meal-id**

Get users meal by meal id

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals/[meal-id]”, {
        method: ‘GET’,
        headers: {
            authorization: ‘bearer [authorization token]’
        }
    });

**Example response:**

    {
        carbs: "60"
        date_added: "2019-11-09T02:19:38Z"
        fats: "0"
        meal_id: 83
        meal_name: "example meal 2"
        protein: "0"
        user_id: 5
    }

**DELETE /meals/:meal-id**

Delete meal by providing the meal id

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals/[meal-id]”, {
        method: ‘DELETE’,
        headers: {
            authorization: ‘bearer [authorization token]’
        }
    });

**PATCH /meals/meal-id**

Update meal by providing the meal id and the new meal information in the body of the request

\*_Example request_

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals/[meal-id]”, {
        method: ‘PATCH’,
        headers: {
            "content-type": "application/json",
            authorization: ‘bearer [authorization token]’
        },
        body: JSON.stringify([updated-meal]),
    });

**GET /user-id/today**

Get meals for the current day by providing the users id

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals/[user-id]/today”, {
        method: ‘GET’,
        headers: {
            authorization: ‘bearer [authorization token]’
        }
    });

**Example response:**

    [
        {
            carbs: "58"
            date_added: "2019-11-09T17:11:02Z"
            fats: "1"
            meal_id: 84
            meal_name: "example meal"
            protein: "20"
            user_id: 5
        },
        {
            carbs: "60"
            date_added: "2019-11-09T02:19:38Z"
            fats: "0"
            meal_id: 83
            meal_name: "example meal 2"
            protein: "0"
            user_id: 5
        }
    ]

**GET /meals/:meal-id/foods**

Get foods in meal by providing the meal id

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/meals/[meal-id]/foods”, {
        method: ‘GET’,
        headers: {
            authorization: ‘bearer [authorization token]’
        }
    });

**Example response:**

    [
        {
            carbs: "12",
            date_added: "2019-11-09T00:08:59Z",
            fats: "0.5",
            food_name: "Sunbeam White Bread Ranch",
            id: 150,
            meal_id: 82,
            protein: "2",
            servings: "2",
            user_id: 5
        },
        {
            carbs: "0",
            date_added: "2019-11-09T00:08:59Z",
            fats: "7",
            food_name: "Peanut Butter & Co. Mighty Maple Peanut Butter, 16 (Pack of 6)",
            id: 151,
            meal_id: 82,
            protein: "3",
            servings: "2",
            user_id: 5
        },
        {
            carbs: "12",
            date_added: "2019-11-09T00:08:59Z",
            fats: "0",
            food_name: "Spreads Jam - Concord Grape",
            id: 152,
            meal_id: 82,
            protein: "0",
            servings: "1",
            user_id: 5
        }
    ]

**GET /foods**

Get all of the users logged foods

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/foods”, {
        method: ‘GET’,
        headers: {
            authorization: ‘bearer [authorization token]’
        },
        user: [user id],
    });

**Example response:**

    [
        {
            carbs: "12",
            date_added: "2019-11-09T00:08:59Z",
            fats: "0.5",
            food_name: "Sunbeam White Bread Ranch",
            id: 150,
            meal_id: 82,
            protein: "2",
            servings: "2",
            user_id: 5
        },
        {
            carbs: "0",
            date_added: "2019-11-09T00:08:59Z",
            fats: "7",
            food_name: "Peanut Butter & Co. Mighty Maple Peanut Butter, 16 of (Pack of 6)",
            id: 151,
            meal_id: 82,
            protein: "3",
            servings: "2",
            user_id: 5
        },
        {
            carbs: "12",
            date_added: "2019-11-09T00:08:59Z",
            fats: "0",
            food_name: "Spreads Jam - Concord Grape",
            id: 152,
            meal_id: 82,
            protein: "0",
            servings: "1",
            user_id: 5
        }
    ]

**POST /foods**

Post new foods to users log

New meals should include the following:

    const newFood = {
        user_id: 1,
        meal_id: 1,
        food_name: "example food",
        protein: 0,
        carbs: 2,
        fats: 3,
        servings: 1
    };

**Example Request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/foods”, {
        method: ‘POST’,
        headers: {
            "content-type": "application/json",
            authorization: ‘bearer [authorization token]’
        },
        body: JSON.stringify([new-food])
    });

**GET /foods/food-id**

Get food by providing the food id

**Example Request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/foods/[food-id]”, {
        method: ‘GET’,
        headers: {
            authorization: ‘bearer [authorization token]’
        }
    });

**Example response**

    {
        carbs: "12",
        date_added: "2019-11-09T00:08:59Z",
        fats: "0",
        food_name: "Spreads Jam - Concord Grape",
        id: 152,
        meal_id: 82,
        protein: "0",
        servings: "1",
        user_id: 5
    }

**DELETE /foods/food-id**

Delete foods by providing the id

**Example Request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/foods/[food-id]”, {
        method: ‘DELETE’,
        headers: {
            authorization: ‘bearer [authorization token]’
        }
    });

**PATCH /foods/food-id**

Update foods by providing the food id and the updated information in the body of the request

**Example request**

    fetch(“https://fast-gorge-81708.herokuapp.com/api/foods/[food-id]”, {
        method: ‘PATCH’,
        headers: {
            "content-type": "application/json",
            authorization: ‘bearer [authorization token]’
        }
        body: JSON.stringify([updated-food]),
    });

**Response codes**

The API uses the following standard response codes.

- "500 - Internal Server Error"

GET requests

- "200 - Ok"

POST requests

- "201 - Created"
- "400 - Bad Request"
- "204 - No Content"

PATCH requests

- "200 - Ok"
