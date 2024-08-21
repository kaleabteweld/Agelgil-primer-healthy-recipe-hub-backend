import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../user/user.type";
import { EPreferredMealTime, IRecipe, TPreferredMealTime } from "../Recipe/recipe.type";

export enum ETimeRange {
    week = "week",
    day = "day"
}

export type TTimeRange = "week" | "day";

export interface IMealPlanner extends mongoose.Document {
    timeRange: {
        start: Date;
        end: Date;
        type: ETimeRange;
    },
    user: Schema.Types.ObjectId | IUser;
    meals: {
        mealTime: TPreferredMealTime;
        recipe: Schema.Types.ObjectId | IRecipe;
    }[];
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
