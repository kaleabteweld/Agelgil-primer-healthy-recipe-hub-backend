import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import { IIngredient } from "../Ingredient/ingredient.type";
import { IModerator } from "../Moderator/moderator.type";
import { IReview } from "../Review/review.type";
import { IUser } from "../user/user.type";
import { IPagination } from "../../Types";

export enum EPreferredMealTime {
    breakfast = "breakfast",
    lunch = "lunch",
    dinner = "dinner",
    snack = "snack",
    dessert = "dessert",
    drink = "drink",
    other = "other",
}
export type TPreferredMealTime = "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "drink" | "other";


export enum EPreparationDifficulty {
    easy = "easy",
    medium = "medium",
    hard = "hard",
}
export type TPreparationDifficulty = "easy" | "medium" | "hard";


export enum ERecipeStatus {
    verified = "verified",
    pending = "pending",
    rejected = "rejected",
}
export type TRecipeStatus = "verified" | "pending" | "rejected";
interface IngredientDetail {
    Ingredient: Schema.Types.ObjectId | IIngredient;
    amount: number;
}

export interface IRecipe extends mongoose.Document {
    name: string;
    description?: string;
    imgs: string[];
    category: string;
    preferredMealTime: TPreferredMealTime[];
    preparationDifficulty: TPreparationDifficulty;
    cookingTime: number;
    ingredients: IngredientDetail[];
    instructions: string;

    rating: number;
    reviews: Schema.Types.ObjectId[] | IReview[];

    status: TRecipeStatus;
    moderator?: {
        moderator: Schema.Types.ObjectId | IModerator;
        Comment: string;
    };

    user: {
        user: Schema.Types.ObjectId | IUser;
        full_name: string;
        profile_img: string;
    }
}

export interface IRecipeMethods {
}

export interface IRecipeDocument extends IRecipe, IRecipeMethods, mongoose.Document { }

export interface IRecipeModel extends mongoose.Model<IRecipeDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IRecipeDocument>
    update(_id: string, newUser: IRecipeUpdateFrom, populatePath?: string | string[]): Promise<IRecipeDocument | null>
    removeByID(_id: string): Promise<void>
    addModerator(this: mongoose.Model<IRecipe>, _id: string, moderatorId: string, body: IModeratorRecipeUpdateFrom): Promise<IRecipe>
    getRecipesReview(_id: string, pagination: IPagination): Promise<IReview[]>
}

export interface INewRecipeFrom {
    name: string;
    description?: string;
    imgs: string[];
    preferredMealTime: TPreferredMealTime[];
    preparationDifficulty: TPreparationDifficulty;
    cookingTime: number;
    ingredients: IngredientDetail[];
    instructions: string;
}

export interface IRecipeUpdateFrom extends Partial<INewRecipeFrom> {
}

export interface IModeratorRecipeUpdateFrom {
    status: TRecipeStatus;
    Comment: string;
}

