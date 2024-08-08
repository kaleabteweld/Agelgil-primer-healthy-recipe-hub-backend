import Joi from "joi";
import mongoose from "mongoose";
import { IRecipe } from "../Recipe/recipe.type";
import { IPagination } from "../../Types";

export enum EStatus {
    active = "active",
    disabled = "disabled",
    blocked = "blocked",
}

export type TStatus = "active" | "disabled" | "blocked";

export interface IUser extends mongoose.Document {
    profile_img?: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    status: TStatus;

    booked_recipes: mongoose.Types.ObjectId[] | IRecipe[];
    my_recipes: mongoose.Types.ObjectId[] | IRecipe[];
}

export interface IUserMethods {
    encryptPassword(this: IUser, password?: string): Promise<String>
    checkPassword(this: IUser, password: string): Promise<boolean>
}

export interface IUserDocument extends IUser, IUserMethods, mongoose.Document { }

export interface IUserModel extends mongoose.Model<IUserDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getByEmail(email: string): Promise<IUserDocument>
    getById(_id: string): Promise<IUserDocument>
    setStatus(_id: string, status: TStatus): Promise<IUserDocument | null>
    update(_id: string, newUser: IUserUpdateFrom, populatePath?: string | string[]): Promise<IUserDocument | null>
    removeByID(_id: string): Promise<void>
    getBookedRecipes(_id: string, pagination: IPagination): Promise<IRecipe[]>
    toggleBookedRecipes(_id: string, recipe: IRecipe): Promise<IRecipe[]>
}

export interface IUserLogInFrom {
    email: string;
    password: string;
}

export interface IUserSignUpFrom {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    profile_img?: string;
}

export interface IUserUpdateFrom extends Partial<IUserSignUpFrom> {
}


