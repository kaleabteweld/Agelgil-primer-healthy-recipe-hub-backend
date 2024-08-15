import Joi from "joi";
import mongoose from "mongoose";


export interface IIngredient extends mongoose.Document {
    name: string;
    type: string;
    unit: string;
    localName: string;
}

export interface IIngredientMethods {
}

export interface IIngredientDocument extends IIngredient, IIngredientMethods, mongoose.Document { }

export interface IIngredientModel extends mongoose.Model<IIngredientDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IIngredientDocument>
    update(_id: string, newUser: IngredientUpdateFrom, populatePath?: string | string[]): Promise<IIngredientDocument | null>
    removeByID(_id: string): Promise<void>
}

export interface INewIngredientFrom {
    name: string;
    type: string;
    unit: string;
    localName: string;
}

export interface IngredientUpdateFrom extends Partial<INewIngredientFrom> {
}


