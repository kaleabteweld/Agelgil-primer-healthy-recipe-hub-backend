import Joi from "joi";
import { EPreferredMealTime, EPreparationDifficulty, ERecipeStatus, IModeratorRecipeUpdateFrom, INewRecipeFrom, IRecipeSearchFrom, IRecipeUpdateFrom } from "./recipe.type";
import { EChronicDisease, EDietaryPreferences } from "../user/user.type";


export const newRecipeSchema = Joi.object<INewRecipeFrom>({
    cookingTime: Joi.number().required(),
    description: Joi.string().optional(),
    imgs: Joi.array().items(Joi.string()).required(),
    instructions: Joi.string().required(),
    name: Joi.string().required(),
    preferredMealTime: Joi.array().items(Joi.string().valid(...Object.values(EPreferredMealTime)).required()).required(),
    preparationDifficulty: Joi.string().valid(...Object.values(EPreparationDifficulty)).required(),
    ingredients: Joi.array().items(Joi.object({
        ingredient: Joi.string().required(),
        amount: Joi.number().required(),
    })).required(),
    medical_condition: Joi.object({
        chronicDiseases: Joi.array().items(Joi.string().valid(...Object.values(EChronicDisease)).required()).required(),
        dietary_preferences: Joi.array().items(Joi.string().valid(...Object.values(EDietaryPreferences)).required()).required(),
    }).required(),
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
        ingredient: Joi.string().optional(),
        amount: Joi.number().optional(),
    })).optional(),
    medical_condition: Joi.object({
        chronicDiseases: Joi.array().items(Joi.string().valid(...Object.values(EChronicDisease)).optional()),
        dietary_preferences: Joi.array().items(Joi.string().valid(...Object.values(EDietaryPreferences)).optional()),
    }).optional(),
});

export const moderatorRecipeUpdateSchema = Joi.object<IModeratorRecipeUpdateFrom>({
    status: Joi.string().valid(...Object.values(ERecipeStatus)).required(),
    Comment: Joi.string().required(),
});

export const recipeSearchSchema = Joi.object<IRecipeSearchFrom>({
    name: Joi.string().optional(),
    preferredMealTime: Joi.array().items(Joi.string().valid(...Object.values(EPreferredMealTime)).optional()),
    preparationDifficulty: Joi.string().valid(...Object.values(EPreparationDifficulty)).optional(),
    cookingTime: Joi.number().optional(),
    ingredients: Joi.array().items(Joi.string()).optional(),
    sort: Joi.array().items(Joi.object({
        field: Joi.string().required(),
        order: Joi.string().valid('asc', 'desc').required(),
    })).optional(),
    medical_condition: Joi.object({
        chronicDiseases: Joi.array().items(Joi.string().valid(...Object.values(EChronicDisease)).optional()),
        dietary_preferences: Joi.array().items(Joi.string().valid(...Object.values(EDietaryPreferences)).optional()),
    }).optional(),
});




