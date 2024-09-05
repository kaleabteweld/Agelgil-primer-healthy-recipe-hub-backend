import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../user.type";
import { EPreferredMealTime, IRecipe, TPreferredMealTime } from "../../Recipe/recipe.type";
import { NutritionData } from "../../../Util/calorieninjas/types";

export interface INutritionGoal {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface IMealPlanner extends mongoose.Document {
    nutritionGoal: INutritionGoal,
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
}
