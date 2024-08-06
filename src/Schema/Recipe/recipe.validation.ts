import Joi from "joi";
import { EPreferredMealTime, EPreparationDifficulty, INewRecipeFrom, IRecipeUpdateFrom } from "./recipe.type";


export const newRecipeSchema = Joi.object<INewRecipeFrom>({
    cookingTime: Joi.number().required(),
    description: Joi.string().optional(),
    imgs: Joi.array().items(Joi.string()).required(),
    instructions: Joi.string().required(),
    name: Joi.string().required(),
    preferredMealTime: Joi.array().items(Joi.string().valid(...Object.values(EPreferredMealTime)).required()),
    preparationDifficulty: Joi.string().valid(...Object.values(EPreparationDifficulty)).required(),
    ingredients: Joi.array().items(Joi.object({
        Ingredient: Joi.string().required(),
        amount: Joi.number().required(),
    })).required(),
    // nutritionalInformation: Joi.string().optional(),
});

export const recipeUpdateSchema = Joi.object<IRecipeUpdateFrom>({
    cookingTime: Joi.number().optional(),
    description: Joi.string().optional(),
    imgs: Joi.array().items(Joi.string()).optional(),
    instructions: Joi.string().optional(),
    name: Joi.string().optional(),
    preferredMealTime: Joi.array().items(Joi.string().valid(...Object.values(EPreferredMealTime)).optional()),
    preparationDifficulty: Joi.string().valid(...Object.values(EPreparationDifficulty)).optional(),
    ingredients: Joi.array().items(Joi.object({
        Ingredient: Joi.string().optional(),
        amount: Joi.number().optional(),
    })).optional(),
    // nutritionalInformation: Joi.string().optional(),
});




