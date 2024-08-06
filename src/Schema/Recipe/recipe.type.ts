import Joi from "joi";
import mongoose, { Schema } from "mongoose";

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

interface IngredientDetail {
    Ingredient: Schema.Types.ObjectId;
    amount: number;
}

export interface IRecipe extends mongoose.Document {
    name: string;
    description?: string;
    imgs: string[];
    preferredMealTime: TPreferredMealTime[];
    preparationDifficulty: TPreparationDifficulty;
    cookingTime: number;
    ingredients: IngredientDetail[];
    instructions: string;
    rating: number;
    active: boolean;
    moderator_Comment?: string;

    nutritionalInformation?: Schema.Types.ObjectId;
    approved_moderators?: Schema.Types.ObjectId;
}

export interface IRecipeMethods {
}

export interface IRecipeDocument extends IRecipe, IRecipeMethods, mongoose.Document { }

export interface IRecipeModel extends mongoose.Model<IRecipeDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IRecipeDocument>
    update(_id: string, newUser: IRecipeUpdateFrom, populatePath?: string | string[]): Promise<IRecipeDocument | null>
    removeByID(_id: string): Promise<void>
}

export interface INewRecipeFrom {
    name: string;
    description?: string;
    imgs: string[];
    preferredMealTime: TPreferredMealTime[];
    preparationDifficulty: TPreparationDifficulty;
    cookingTime: number;
    nutritionalInformation?: Schema.Types.ObjectId;
    ingredients: IngredientDetail[];
    instructions: string;
}

export interface IRecipeUpdateFrom extends Partial<INewRecipeFrom> {
}


