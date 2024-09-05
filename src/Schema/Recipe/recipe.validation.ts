import Joi from "joi";
import { EPreferredMealTime, EPreparationDifficulty, ERecipeStatus, IModeratorRecipeUpdateFrom, INewRecipeFrom, IRecipeSearchFrom, IRecipeUpdateFrom } from "./recipe.type";
import { EAllergies, EChronicDisease, EDietaryPreferences } from "../User/user.type";


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
        unit: Joi.string().required(),
        amount: Joi.number().required(),
    })).required(),
    medical_condition: Joi.object({
        chronicDiseases: Joi.array().items(Joi.string().valid(...Object.values(EChronicDisease)).required()).required(),
        dietary_preferences: Joi.array().items(Joi.string().valid(...Object.values(EDietaryPreferences)).required()).required(),
        allergies: Joi.array().items(Joi.string().valid(...Object.values(EAllergies)).required()).required(),
    }).required(),
    youtubeLink: Joi.string().uri().optional(),
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
        unit: Joi.string().optional(),
        amount: Joi.number().optional(),
    })).optional(),
    medical_condition: Joi.object({
        chronicDiseases: Joi.array().items(Joi.string().valid(...Object.values(EChronicDisease)).optional()),
        dietary_preferences: Joi.array().items(Joi.string().valid(...Object.values(EDietaryPreferences)).optional()),
        allergies: Joi.array().items(Joi.string().valid(...Object.values(EAllergies)).optional()),
    }).optional(),
    youtubeLink: Joi.string().uri().optional(),
});

export const moderatorRecipeUpdateSchema = Joi.object<IModeratorRecipeUpdateFrom>({
    status: Joi.string().valid(...Object.values(ERecipeStatus)).required(),
    comment: Joi.string().required(),
});

export const recipeSearchSchema = Joi.object<IRecipeSearchFrom>({
    name: Joi.string().min(0).optional(),
    preferredMealTime: Joi.array().items(Joi.string().valid(...Object.values(EPreferredMealTime)).optional()),
    preparationDifficulty: Joi.string().valid(...Object.values(EPreparationDifficulty)).optional(),
    cookingTime: Joi.number().optional(),
    ingredients: Joi.array().items(Joi.string()).optional(),
    sort: Joi.array().items(Joi.object({
        field: Joi.string().required(),
        order: Joi.string().valid('asc', 'desc').required(),
    })).optional(),
    medical_condition: Joi.object({
        chronicDiseases: Joi.array().items(Joi.string().valid(...Object.values(EChronicDisease)).optional().optional()),
        dietary_preferences: Joi.array().items(Joi.string().valid(...Object.values(EDietaryPreferences)).optional()),
        allergies: Joi.array().items(Joi.string().valid(...Object.values(EAllergies)).optional()),
    }).optional(),
    rating: Joi.number().min(0).max(5).optional(),
    type: Joi.string().optional(),
});




