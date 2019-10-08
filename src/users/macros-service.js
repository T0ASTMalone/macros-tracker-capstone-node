const MacrosService = {
  macrosSoFar(meals, usrMacros) {
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    meals.forEach(meal => {
      protein += parseInt(meal.protein);
      carbs += parseInt(meal.carbs);
      fats += parseInt(meal.fats);
    });

    const macros = { protein, carbs, fats };

    const proteinPercent = Math.round((protein / usrMacros.protein) * 100);
    const carbsPercent = Math.round((carbs / usrMacros.carbs) * 100);
    const fatsPercent = Math.round((fats / usrMacros.fats) * 100);

    const macrosPercent = { proteinPercent, carbsPercent, fatsPercent };

    if (macrosPercent.proteinPercent > 100) {
      macrosPercent.proteinPercent = 100;
    }
    if (macrosPercent.carbsPercent > 100) {
      macrosPercent.carbsPercent = 100;
    }
    if (macrosPercent.fatsPercent > 100) {
      macrosPercent.fatsPercent = 100;
    }

    return { macrosPercent, macros };
  },

  totalMealMacros(foods) {
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    foods.forEach(food => {
      protein += parseInt(food.protein);
      carbs += parseInt(food.carbs);
      fats += parseInt(food.fats);
    });
    const macros = { protein, carbs, fats };
    return macros;
  },

  totalFoodMacros(food) {
    Object.keys(food).map(key => {
      if (key === 'protein' || key === 'carbs' || key === 'fats') {
        food[key] = parseInt(food.servings) * parseInt(food[key]);
      }
      return key;
    });
  },

  calculateUserMacros(user) {
    const { gender, goals, height, age, activityLvl } = user;
    const weight = parseFloat(user.weight);

    let pCoef = 1;
    let fCoef = 0.4;
    let tdee;

    if (gender === 'male') {
      tdee = 10 * weight + 6.25 * height - 5 * parseInt(age) + 5;
    }

    if (gender === 'female') {
      fCoef = 0.3;
      tdee = 10 * weight + 6.25 * height - 5 * parseInt(age) - 161;
    }

    tdee *= parseFloat(activityLvl);

    if (goals === 'gain') {
      tdee += 500;
    } else if (goals === 'lose') {
      tdee -= 500;
    }

    const protein = Math.round(weight * 2.2 * pCoef);

    tdee -= protein * 4;

    const fats = Math.round(weight * 2.2 * fCoef);

    tdee -= fats * 9;

    const carbs = Math.round(tdee / 4);

    const userMacros = { protein, carbs, fats };

    return userMacros;
  }
};

module.exports = MacrosService;
