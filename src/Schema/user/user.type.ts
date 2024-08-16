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

export enum EChronicDisease {
    diabetes = "diabetes",
    hypertension = "hypertension",
    obesity = "obesity",
    heart_disease = "heart_disease",
    kidney_disease = "kidney_disease",
    liver_disease = "liver_disease",
    other = "other",
    none = "none",
}

export type TChronicDisease = "diabetes" | "hypertension" | "obesity" | "heart_disease" | "kidney_disease" | "liver_disease" | "other" | "none";

export enum EDietaryPreferences {
    vegetarian = "vegetarian",
    vegan = "vegan",
    gluten_free = "gluten_free",
    dairy_free = "dairy_free",
    nut_free = "nut_free",
    LowSugar = "LowSugar",
    other = "other",
    none = "none",
}

export type TDietaryPreferences = "vegetarian" | "vegan" | "gluten_free" | "dairy_free" | "nut_free" | "LowSugar" | "other" | "none";
export interface IMedicalCondition extends mongoose.Document {
    chronicDiseases: TChronicDisease[];
    dietary_preferences: EDietaryPreferences[];
}

export interface IUser extends mongoose.Document {
    profile_img?: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    status: TStatus;

    medical_condition: IMedicalCondition;

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
    getMyRecipes(_id: string, pagination: IPagination): Promise<IRecipe[]>
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

    medical_condition: IMedicalCondition;
}

export interface IUserUpdateFrom extends Partial<IUserSignUpFrom> {
}


