interface UserData {
    weightKg: number;
    heightCm: number;
    age: number;
    gender: 'male' | 'female';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
}

interface NutritionNeeds {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbohydrates_g: number;
}

function calculateNutritionNeeds(user: UserData, goal: 'lose' | 'maintain' | 'gain' | 'bodybuilding'): NutritionNeeds {
    const { weightKg, heightCm, age, gender, activityLevel } = user;

    let bmr: number;
    if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const activityMultiplier: Record<UserData['activityLevel'], number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
    };

    const tdee = bmr * activityMultiplier[activityLevel];

    let caloricNeeds: number;
    switch (goal) {
        case 'lose':
            caloricNeeds = tdee - 500;
            break;
        case 'gain':
            caloricNeeds = tdee + 500;
            break;
        case 'bodybuilding':
            caloricNeeds = tdee + 300;
            break;
        case 'maintain':
        default:
            caloricNeeds = tdee;
            break;
    }

    let proteinPerKg: number;
    if (goal === 'bodybuilding' || goal === 'gain') {
        proteinPerKg = 1.6;
    } else {
        proteinPerKg = 1.2;
    }
    const protein_g = proteinPerKg * weightKg;

    const fatPercentage = 0.30;
    const fat_g = (caloricNeeds * fatPercentage) / 9;

    const proteinCalories = protein_g * 4;
    const fatCalories = fat_g * 9;
    const carbohydrateCalories = caloricNeeds - (proteinCalories + fatCalories);
    const carbohydrates_g = carbohydrateCalories / 4;

    return {
        calories: Math.round(caloricNeeds),
        protein_g: Math.round(protein_g),
        fat_g: Math.round(fat_g),
        carbohydrates_g: Math.round(carbohydrates_g),
    };
}

