import Joi from "joi";
import mongoose from "mongoose";
import { IRecipe, TRecipeStatus } from "../Recipe/recipe.type";
import { IPagination } from "../../Types";
import { IMealPlanner } from "./MealPlanner/mealPlanner.type";

export enum EStatus {
    active = "active",
    disabled = "disabled",
    blocked = "blocked",
}

export enum EVerified {
    pending = "pending",
    verified = "verified",
}

export type TVerified = "pending" | "verified";

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

export interface IMedicalCondition extends mongoose.Document {
    chronicDiseases: EChronicDisease[];
    dietary_preferences: EDietaryPreferences[];
    allergies: EAllergies[];
    // diet_goals?: EDietGoals;
}

export enum EXpType {
    addRecipe = 5,
    removeRecipe = -5,
    bookRecipe = 10,
    unBookRecipe = -10,
    newFollower = 5,
    unFollow = -5,
    positiveReview = 15,
    negativeReview = -15,
    approveRecipe = 15,
    rejectRecipe = -15,
}
export interface IMedicalConditionInput {
    chronicDiseases: EChronicDisease[];
    dietary_preferences: EDietaryPreferences[];
    allergies: EAllergies[];

}

export interface IMedicalConditionInput {
    chronicDiseases: EChronicDisease[];
    dietary_preferences: EDietaryPreferences[];
    allergies: EAllergies[];
}

export interface IUser extends mongoose.Document {
    xp: number;
    profile_img?: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    status: TStatus;
    verified: EVerified;

    medical_condition: IMedicalCondition;

    mealPlanner?: mongoose.Types.ObjectId | IMealPlanner;

    booked_recipes: mongoose.Types.ObjectId[] | IRecipe[];
    my_recipes: mongoose.Types.ObjectId[] | IRecipe[];

}

export interface IUserMethods {
    encryptPassword(this: IUser, password?: string): Promise<String>
    checkPassword(this: IUser, password: string): Promise<boolean>
    hasBookedRecipe(this: IUser, recipeId: any): boolean
    ownsRecipe(this: IUser, recipeId: any): boolean
    addXp(this: IUser, xpType: EXpType): Promise<IUser>
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
    verified?: EVerified;
    status?: EStatus;
}


export interface IUserSearchFrom {
    fullName?: string;
    sort?: { field: string, order: mongoose.SortOrder }[];
    medical_condition?: IMedicalCondition;
    status: TStatus;
    verified: EVerified;
}
