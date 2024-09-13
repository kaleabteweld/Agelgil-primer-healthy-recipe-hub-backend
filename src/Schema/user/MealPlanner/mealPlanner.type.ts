import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../user.type";
import { EPreferredMealTime, IRecipe, TPreferredMealTime } from "../../Recipe/recipe.type";
import { NutritionData } from "../../../Util/calorieninjas/types";


export enum EDietGoals {
    weight_loss = "weight_loss",
    weight_gain = "weight_gain",
    muscle_gain = "muscle_gain",
    maintain_weight = "maintain_weight",
    none = "none",
}

export type TDietGoals = "weight_loss" | "weight_gain" | "muscle_gain" | "maintain_weight" | "none";

export enum EGender {
    male = "male",
    female = "female"
}

export type tGender = "male" | "female"

export enum EActivityLevel {
    sedentary = "sedentary",
    light = "light",
    moderate = "moderate",
    active = "active",
    veryActive = "veryActive"
}

export type TActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive"

export interface INutritionGoal {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface IUserStats {
    weights: {
        date: Date;
        value: number;
    };
    weight: number;
    height: number;
    age: number
    gender: EGender;
    activityLevel: EActivityLevel
    diet_goals: EDietGoals;
}

export interface IMealPlanner extends mongoose.Document {
    nutritionGoal: INutritionGoal,
    currentNutrition: INutritionGoal,
    user: mongoose.Schema.Types.ObjectId | IUser,
    userStats?: IUserStats,
    recipes: {
        [key in EPreferredMealTime]: {
            recipe: mongoose.Schema.Types.ObjectId[] | IRecipe[],
            nutrition: NutritionData;
        }
    }
}

export interface IMealPlannerMethods {
    addToMealPlanner(mealTime: EPreferredMealTime, recipe: IRecipe): Promise<IMealPlanner>
    removeFromMealPlanner(mealTime: EPreferredMealTime, recipe: IRecipe): Promise<IMealPlanner>
}

export interface IMealPlannerDocument extends IMealPlanner, IMealPlannerMethods, mongoose.Document { }

export interface IMealPlannerModel extends mongoose.Model<IMealPlannerDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IMealPlannerDocument>
    removeByID(_id: string): Promise<void>
    generateWeekPlanRecipes(user: IUser, mealTime: EPreferredMealTime, page?: number): Promise<IRecipe[]>
    checkIfUserOwnsMealPlanner(_id: string, user: IUser): Promise<boolean>
    getUserMeals(_id: string, mealTime: EPreferredMealTime, page: number): Promise<IMealPlanner | null>
    checkIfUserHasRecipe(_id: string, time: EPreferredMealTime, recipeId: string): Promise<IMealPlanner>
    checkIfUserDoseNotRecipe(_id: string, time: EPreferredMealTime, recipeId: string): Promise<IMealPlanner>
    removeRecipeFromMealPlan(_id: string, time: EPreferredMealTime, recipeId: string): Promise<void>
    resetRecipes(_id: string): Promise<IMealPlanner>
    getNutritionGoal(_id: string): Promise<INutritionGoal>
    getByUser(userId: string): Promise<IMealPlanner>
    checkIfUserHasMealPlan(_id: string): Promise<IMealPlanner>
    checkIfUserIsInitialized(_id: string): Promise<void>
}

export interface INewMealPlanner {
    weight: number;
    height: number;
    age: number
    gender: EGender;
    activityLevel: EActivityLevel
    diet_goals: EDietGoals;
}

export interface IMealPlannerUpdateFrom extends Partial<INewMealPlanner> { }