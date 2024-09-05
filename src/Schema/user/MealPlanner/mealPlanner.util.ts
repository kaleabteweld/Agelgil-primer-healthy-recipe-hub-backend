import { EActivityLevel, EDietGoals, EGender, IUserStats } from "../user.type";
import { INutritionGoal } from "./mealPlanner.type";

export function calculateBestWeight(user: IUserStats) {

    const { age, height } = user;
    const BMI_MIN = 18.5;
    const BMI_MAX = 24.9;

    let idealWeightMin = BMI_MIN * Math.pow(height, 2);
    let idealWeightMax = BMI_MAX * Math.pow(height, 2);

    let ageAdjustmentFactor = 1.0;

    if (age < 25) {
        ageAdjustmentFactor = 0.98;
    } else if (age >= 35 && age <= 44) {
        ageAdjustmentFactor = 1.02;
    } else if (age >= 45 && age <= 54) {
        ageAdjustmentFactor = 1.04;
    } else if (age >= 55) {
        ageAdjustmentFactor = 1.06;
    }

    // Apply age adjustment to ideal weight range
    idealWeightMin *= ageAdjustmentFactor;
    idealWeightMax *= ageAdjustmentFactor;

    return {
        min: idealWeightMin.toFixed(2),
        max: idealWeightMax.toFixed(2),
    };
}


export function calculateNutritionNeeds(user: IUserStats): INutritionGoal {

    const { activityLevel, age, diet_goals, gender, height, weight } = user;

    let bmr: number;
    if (gender === EGender.male) {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultiplier: Record<EActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
    };

    const tdee = bmr * activityMultiplier[activityLevel];

    let caloricNeeds: number;
    switch (diet_goals) {
        case EDietGoals.weight_loss:
            caloricNeeds = tdee - 500;
            break;
        case EDietGoals.weight_gain:
            caloricNeeds = tdee + 500;
            break;
        case EDietGoals.muscle_gain:
            caloricNeeds = tdee + 300;
            break;
        case EDietGoals.maintain_weight:
        default:
            caloricNeeds = tdee;
            break;
    }

    let proteinPerKg: number;
    if (diet_goals === EDietGoals.muscle_gain || diet_goals === EDietGoals.weight_gain) {
        proteinPerKg = 1.6;
    } else {
        proteinPerKg = 1.2;
    }
    const protein_g = proteinPerKg * weight;

    const fatPercentage = 0.30;
    const fat_g = (caloricNeeds * fatPercentage) / 9;

    const proteinCalories = protein_g * 4;
    const fatCalories = fat_g * 9;
    const carbohydrateCalories = caloricNeeds - (proteinCalories + fatCalories);
    const carbohydrates_g = carbohydrateCalories / 4;

    return {
        calories: Math.round(caloricNeeds),
        protein: Math.round(protein_g),
        fat: Math.round(fat_g),
        carbs: Math.round(carbohydrates_g),
    };
}

