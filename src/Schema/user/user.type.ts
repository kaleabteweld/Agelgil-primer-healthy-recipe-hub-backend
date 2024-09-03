import Joi from "joi";
import mongoose from "mongoose";
import { IRecipe, TRecipeStatus } from "../Recipe/recipe.type";
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

export enum EAllergies {
    peanuts = "peanuts",
    tree_nuts = "tree_nuts",
    shellfish = "shellfish",
    dairy = "dairy",
    eggs = "eggs",
    wheat = "wheat",
    soy = "soy",
    fish = "fish",
    other = "other",
    none = "none",
}

export type TAllergies = "peanuts" | "tree_nuts" | "shellfish" | "dairy" | "eggs" | "wheat" | "soy" | "fish" | "other" | "none";

export enum EDietGoals {
    weight_loss = "weight_loss",
    weight_gain = "weight_gain",
    muscle_gain = "muscle_gain",
    maintain_weight = "maintain_weight",
    none = "none",
}

export type TDietGoals = "weight_loss" | "weight_gain" | "muscle_gain" | "maintain_weight" | "none";

export interface IMedicalCondition extends mongoose.Document {
    chronicDiseases: EChronicDisease[];
    dietary_preferences: EDietaryPreferences[];
    allergies: EAllergies[];
    // diet_goals?: EDietGoals;
}

export interface IMedicalConditionInput {
    chronicDiseases: EChronicDisease[];
    dietary_preferences: EDietaryPreferences[];
    allergies: EAllergies[];
    // diet_goals: EDietGoals;
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
    verified: boolean;

    medical_condition: IMedicalCondition;

    booked_recipes: mongoose.Types.ObjectId[] | IRecipe[];
    my_recipes: mongoose.Types.ObjectId[] | IRecipe[];

}

export interface IUserMethods {
    encryptPassword(this: IUser, password?: string): Promise<String>
    checkPassword(this: IUser, password: string): Promise<boolean>
    hasBookedRecipe(this: IUser, recipeId: any): boolean
    ownsRecipe(this: IUser, recipeId: any): boolean
}

export interface IUserDocument extends IUser, IUserMethods, mongoose.Document {
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getByEmail(email: string): Promise<IUserDocument>
    getById(_id: string): Promise<IUserDocument>
    setStatus(_id: string, status: TStatus): Promise<IUserDocument | null>
    update(_id: string, newUser: IUserUpdateFrom, populatePath?: string | string[]): Promise<IUserDocument | null>
    removeByID(_id: string): Promise<void>
    getBookedRecipes(_id: string, pagination: IPagination): Promise<IRecipe[]>
    toggleBookedRecipes(_id: string, recipe: IRecipe): Promise<IRecipe[]>
    getMyRecipes(_id: string, pagination: IPagination, status: TRecipeStatus): Promise<IRecipe[]>
    updateUserStatus(userId: string, body: IModeratorUserUpdateSchema): Promise<IUser>
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

    medical_condition: IMedicalConditionInput;
}

export interface IUserUpdateFrom extends Partial<IUserSignUpFrom> {
}


export interface IModeratorUserUpdateSchema {
    verified?: boolean;
    status?: EStatus;
}


export interface IUserSearchFrom {
    fullName?: string;
    sort?: { field: string, order: mongoose.SortOrder }[];
    medical_condition?: IMedicalCondition;
    status: TStatus;
    verified: boolean;
}
