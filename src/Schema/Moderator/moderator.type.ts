import Joi from "joi";
import mongoose from "mongoose";
import { ERecipeStatus, IRecipe } from "../Recipe/recipe.type";

export enum EStatus {
    active = "active",
    disabled = "disabled",
    blocked = "blocked",
}

export type TStatus = "active" | "disabled" | "blocked";

export interface IModerator extends mongoose.Document {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    status: TStatus;
    bio: string;
    profile_img?: string;

    moderated_recipe: {
        recipe: mongoose.Types.ObjectId | IRecipe,
        comment: string,
        status: ERecipeStatus,
    }[];

}

export interface IModeratorMethods {
    encryptPassword(this: IModerator, password?: string): Promise<String>
    checkPassword(this: IModerator, password: string): Promise<boolean>
}

export interface IModeratorDocument extends IModerator, IModeratorMethods, mongoose.Document { }

export interface IModeratorModel extends mongoose.Model<IModeratorDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getByEmail(email: string): Promise<IModeratorDocument>
    getById(_id: string): Promise<IModeratorDocument>
    setStatus(_id: string, status: TStatus): Promise<IModeratorDocument | null>
    update(_id: string, newUser: IModeratorUpdateFrom, populatePath?: string | string[]): Promise<IModeratorDocument | null>
    removeByID(_id: string): Promise<void>
}

export interface IModeratorLogInFrom {
    email: string;
    password: string;
}

export interface IModeratorSignUpFrom {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    bio: string;
    profile_img?: string;
}

export interface IModeratorUpdateFrom extends Partial<IModeratorSignUpFrom> {
}


