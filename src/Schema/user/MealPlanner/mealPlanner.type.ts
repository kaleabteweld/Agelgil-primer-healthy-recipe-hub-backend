import Joi from "joi";
import mongoose from "mongoose";
import { IUser } from "../user.type";
import { EPreferredMealTime, IngredientDetail, IRecipe } from "../../Recipe/recipe.type";
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
    }[];
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
        recipe: mongoose.Schema.Types.ObjectId | IRecipe,
        mealTime: EPreferredMealTime,
    }[],
    nutrition: NutritionData;
    shoppingList: IngredientDetail[],

}

export interface IMealPlannerMethods {
    addOrMergeShoppingListItem(this: IMealPlanner, ingredient: IngredientDetail[]): Promise<IMealPlanner>
    removeFromShoppingList(this: IMealPlanner, ingredient: IngredientDetail[]): Promise<IMealPlanner>
    hasRecipeInMealPlan(this: IMealPlanner, recipeId: string): Promise<boolean>
}

export interface IMealPlannerDocument extends IMealPlanner, IMealPlannerMethods, mongoose.Document { }

export interface IMealPlannerModel extends mongoose.Model<IMealPlannerDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IMealPlannerDocument>
    removeByID(_id: string): Promise<void>
    checkIfUserOwnsMealPlanner(_id: string, user: IUser): Promise<boolean>
    getUserMeals(_id: string, mealTime: EPreferredMealTime, page: number): Promise<{ recipe: IRecipe; nutrition: NutritionData }[]>
    checkIfUserHasRecipe(_id: string, recipeId: string): Promise<IMealPlannerDocument>
    checkIfUserDoseNotRecipe(_id: string, recipeId: string): Promise<IMealPlannerDocument>
    removeRecipeFromMealPlan(_id: string, recipeId: string): Promise<void>
    resetRecipes(_id: string): Promise<IMealPlannerDocument>
    getNutritionGoal(_id: string): Promise<INutritionGoal>
    getByUser(userId: string): Promise<IMealPlannerDocument>
    checkIfUserHasMealPlan(_id: string): Promise<IMealPlannerDocument>
    checkIfUserIsInitialized(_id: string): Promise<void>
    updateStats(_id: string, body: INewMealPlanner): Promise<IMealPlannerDocument>
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