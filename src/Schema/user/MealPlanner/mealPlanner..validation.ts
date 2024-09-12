import Joi from "joi";
import { EActivityLevel, EDietGoals, EGender, INewMealPlanner } from "./mealPlanner.type";

export const newMealPlannerSchema = Joi.object<INewMealPlanner>({
    activityLevel: Joi.string().valid(...Object.values(EActivityLevel)).required(),
    diet_goals: Joi.string().valid(...Object.values(EDietGoals)).required(),
    gender: Joi.string().valid(...Object.values(EGender)).required(),
    age: Joi.number().required(),
    height: Joi.number().required(),
    weight: Joi.number().required(),
});

export const updateMealPlannerSchema = Joi.object<INewMealPlanner>({
    activityLevel: Joi.string().valid(...Object.values(EActivityLevel)).optional(),
    diet_goals: Joi.string().valid(...Object.values(EDietGoals)).optional(),
    gender: Joi.string().valid(...Object.values(EGender)).optional(),
    age: Joi.number().optional(),
    height: Joi.number().optional(),
    weight: Joi.number().optional(),
});