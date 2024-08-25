import { NutritionData } from "./types";

export default class Calorieninjas {

    apiKey: string;

    constructor(parameters: { apiKey: string }) {
        this.apiKey = parameters.apiKey;
    }

    getNutritionData = async (food: string): Promise<{ items: NutritionData[] }> => {
        try {
            const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${food}`, {
                method: 'GET',
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });
            const data = await response.json();
            return data;
        } catch (error: any) {
            console.log("[-] Calorieninjas error ", error);
            throw error;
        }

    }

    getTotalNutrition = async (food: string): Promise<NutritionData> => {
        const data = await this.getNutritionData(food);
        return data.items.reduce((acc: NutritionData, item: NutritionData) => {
            acc.calories += item.calories;
            acc.carbohydrates_total_g += item.carbohydrates_total_g;
            acc.fat_total_g += item.fat_total_g;
            acc.protein_g += item.protein_g;
            acc.sugar_g += item.sugar_g;
            acc.fiber_g += item.fiber_g;
            acc.sodium_mg += item.sodium_mg;
            acc.potassium_mg += item.potassium_mg;
            acc.cholesterol_mg += item.cholesterol_mg;
            acc.fat_saturated_g += item.fat_saturated_g;
            acc.serving_size_g += item.serving_size_g;
            return acc;
        }, {
            calories: 0,
            carbohydrates_total_g: 0,
            fat_total_g: 0,
            protein_g: 0,
            sugar_g: 0,
            fiber_g: 0,
            sodium_mg: 0,
            potassium_mg: 0,
            cholesterol_mg: 0,
            fat_saturated_g: 0,
            serving_size_g: 0,
            name: ""
        })
    }


}