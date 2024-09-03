import Joi from "joi";
import mongoose from "mongoose";


export interface IIngredient extends mongoose.Document {
    name: string;
    type: string;
    // unit: string;
    unitOptions: string[];
    localName: string;
}

export interface IIngredientMethods {
}

export interface IIngredientDocument extends IIngredient, IIngredientMethods, mongoose.Document { }

export interface IIngredientModel extends mongoose.Model<IIngredientDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IIngredientDocument>
    updateIngredient(_id: string, newIngredient: IngredientUpdateFrom): Promise<IIngredientDocument>
    removeByID(_id: string): Promise<void>
    getUniqueType(): Promise<string[]>
    getUniqueUnitOptions(): Promise<string[]>
}

export interface INewIngredientFrom {
    name: string;
    type: string;
    // unit: string;
    localName: string;
    unitOptions: string[];
}

export interface IngredientUpdateFrom extends Partial<INewIngredientFrom> {
}



export interface IIngredientSearchFrom {
    name?: string;
    type?: string;
    localName?: string;
    unitOptions?: string[];
    sort?: { field: string, order: mongoose.SortOrder }[];
}
