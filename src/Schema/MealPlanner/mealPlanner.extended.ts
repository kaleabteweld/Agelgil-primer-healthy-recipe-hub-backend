import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../Util";
import { IMealPlanner } from "./mealPlanner.type";
import { EPreferredMealTime, ERecipeStatus, IRecipe } from "../Recipe/recipe.type";
import { RecipeSearchBuilder } from "../Recipe/recipe.utils";
import { IUser } from "../user/user.type";



export function validator<T>(mealPlannerInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, mealPlannerInput);
}

export async function getById(this: mongoose.Model<IMealPlanner>, _id: string): Promise<IMealPlanner> {
    try {
        const mealPlanner = await this.findById(new mongoose.Types.ObjectId(_id));
        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "mealPlanner not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return mealPlanner;
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }

}

export async function removeByID(this: mongoose.Model<IMealPlanner>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "mealPlanner not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }
}

export async function generateWeekPlanRecipes(this: mongoose.Model<IMealPlanner>, user: IUser, mealTime: EPreferredMealTime, page?: number): Promise<IRecipe[]> {
    try {
        //TODO use recommended recipes
        const recipes = await (new RecipeSearchBuilder()
            .withStatus(ERecipeStatus.verified)
            .withMedicalCondition(user.medical_condition)
            .withPreferredMealTime([mealTime])
            .withPagination(page)
            .execute());
        return recipes;
    } catch (error) {
        throw error;
    }
}

export async function checkIfUserOwnsMealPlanner(this: mongoose.Model<IMealPlanner>, _id: string, user: IUser): Promise<boolean> {
    try {
        const mealPlanner = await this.find({ _id: new mongoose.Types.ObjectId(_id), user: user._id });
        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "mealPlanner not found or user does not own mealPlanner",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return true;
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }
}

export async function addToMealPlanner(this: IMealPlanner, mealTime: EPreferredMealTime, recipe: IRecipe): Promise<IMealPlanner> {
    try {
        (this.meals as any).addToSet({ mealTime, recipe: recipe });
        await this.save();
        return this;
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }

}

export async function removeFromMealPlanner(this: IMealPlanner, mealTime: EPreferredMealTime, recipe: IRecipe): Promise<IMealPlanner> {
    try {
        (this.meals as any).pull({ mealTime, recipe: recipe });
        await this.save();
        return this;
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }

}