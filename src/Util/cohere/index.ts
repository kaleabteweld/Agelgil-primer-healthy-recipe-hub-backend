import { CohereClient } from "cohere-ai";
import { TModels } from "./type";
import { EmbedInputType } from "cohere-ai/api";
import { IRecipe } from "../../Schema/Recipe/recipe.type";
import { IIngredient } from "../../Schema/Ingredient/ingredient.type";

export default class CohereAI {
    private static instance: CohereAI; // Static property to hold the single instance
    private _cohereClient: CohereClient | null = null;
    private _passive: boolean = false;

    private constructor(token?: string, _passive: boolean = false) {
        this._cohereClient = new CohereClient({
            token: token || "",
        });
        this._passive = _passive;
    }
    // Static method to access the single instance
    public static getInstance(token?: string, _passive: boolean = false): CohereAI {
        if (!CohereAI.instance) {
            CohereAI.instance = new CohereAI(token, _passive);
        }
        return CohereAI.instance;
    }

    async embed(text: String | string[], model: TModels = "embed-english-v3.0", inputType: EmbedInputType | undefined = "classification"): Promise<number[]> {
        var texts: string[] = []
        if (typeof text === 'string' || text instanceof String) texts = text.split(" ");

        if (this._passive) {
            return []
        }
        try {
            const embed = await this._cohereClient?.embed({
                texts,
                model,
                inputType,
            });
            return embed?.embeddings as number[];
        } catch (error) {
            console.log("embedding error", error);
            throw error
        }
    }

    async embedRecipes(recipe: IRecipe, model: TModels = "embed-english-v3.0", inputType: EmbedInputType | undefined = "classification"): Promise<number[]> {
        try {
            //TODO: add medicalConditions
            const embedding = await this.embed(`${recipe.name} ${recipe.description} ${recipe.instructions} ${recipe.cookingTime} mins ${recipe.rating}/5
            ${recipe.preferredMealTime} ${recipe.preparationDifficulty} 
            ${recipe.ingredients.map(ingredientDetail => (ingredientDetail.ingredient as IIngredient).name).join(' ')}`, model, inputType);
            return embedding;
        } catch (error) {
            console.log("Error in embedding recipe", error);
            throw error;
        }
    }
}

