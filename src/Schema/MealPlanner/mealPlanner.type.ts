import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../user/user.type";
import { IRecipe, TPreferredMealTime } from "../Recipe/recipe.type";


export interface IMealPlanner extends mongoose.Document {
    timeRange: {
        start: Date;
        end: Date;
    },
    user: Schema.Types.ObjectId | IUser;
    meals: {
        mealTime: TPreferredMealTime;
        recipe: Schema.Types.ObjectId | IRecipe;
    }[];
}

export interface IMealPlannerMethods {
}

export interface IMealPlannerDocument extends IMealPlanner, IMealPlannerMethods, mongoose.Document { }

export interface IMealPlannerModel extends mongoose.Model<IMealPlannerDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IMealPlannerDocument>
    removeByID(_id: string): Promise<void>
}
