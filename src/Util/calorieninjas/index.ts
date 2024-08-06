import { NutritionData } from "./types";

export default class Calorieninjas {

    apiKey: string;

    constructor(parameters: { apiKey: string }) {
        this.apiKey = parameters.apiKey;
    }

    getNutritionData = async (food: string): Promise<NutritionData> => {
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
}