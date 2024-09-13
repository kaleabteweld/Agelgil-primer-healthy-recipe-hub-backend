import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../../Util";
import { IMealPlanner, INutritionGoal } from "./mealPlanner.type";
import { EPreferredMealTime, ERecipeStatus, IRecipe } from "../../Recipe/recipe.type";
import { RecipeSearchBuilder } from "../../Recipe/recipe.utils";
import { IUser } from "../user.type";



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

export async function getByUser(this: mongoose.Model<IMealPlanner>, userId: string): Promise<IMealPlanner> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(userId) });
        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "mealPlanner not found for user",
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

export async function getUserMeals(this: mongoose.Model<IMealPlanner>, _id: string, mealTime: EPreferredMealTime, page: number): Promise<IMealPlanner | null> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) }).populate({
            path: `recipes.${mealTime}.recipe`,
            match: { status: ERecipeStatus.verified },
            select: ['name', 'description', 'imgs', 'preparationDifficulty', 'preferredMealTime', "rating"],
            options: { limit: page * 10, skip: (page - 1) * 10 }
        }).exec();

        console.log({ mealPlanner });
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

export async function checkIfUserHasRecipe(this: mongoose.Model<IMealPlanner>, _id: string, time: EPreferredMealTime, recipeId: string): Promise<IMealPlanner> {
    try {
        const mealPlanner = await this.findOne({
            user: new mongoose.Types.ObjectId(_id),
        });

        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "User does not have recipe in meal plan",
                statusCode: 404,
                type: "Validation"
            }, "recipeId")
        }

        if (mealPlanner?.recipes[time].recipe.includes(new mongoose.Types.ObjectId(recipeId) as any)) {
            throw ValidationErrorFactory({
                msg: "User already has recipe in meal plan",
                statusCode: 400,
                type: "Validation"
            }, "recipeId")
        }
        return mealPlanner as IMealPlanner;
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

export async function checkIfUserDoseNotRecipe(this: mongoose.Model<IMealPlanner>, _id: string, time: EPreferredMealTime, recipeId: string): Promise<IMealPlanner> {
    try {
        const mealPlanner = await this.findOne({
            user: new mongoose.Types.ObjectId(_id),
        });

        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "User does not have recipe in meal plan",
                statusCode: 404,
                type: "Validation"
            }, "recipeId")
        }

        if (!mealPlanner?.recipes[time].recipe.includes(new mongoose.Types.ObjectId(recipeId) as any)) {
            throw ValidationErrorFactory({
                msg: "User already has recipe in meal plan",
                statusCode: 400,
                type: "Validation"
            }, "recipeId")
        }
        return mealPlanner as IMealPlanner;
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

export async function removeRecipeFromMealPlan(this: mongoose.Model<IMealPlanner>, _id: string, time: EPreferredMealTime, recipeId: string): Promise<void> {
    try {
        const result = await this.updateOne({ user: new mongoose.Types.ObjectId(_id) }, {
            $pull: {
                [`recipes.${time}.recipe`]: new mongoose.Types.ObjectId(recipeId)
            }
        });

        if (result.modifiedCount === 0) {
            throw ValidationErrorFactory({
                msg: "Recipe not found in meal plan",
                statusCode: 404,
                type: "Validation"
            }, "recipeId")
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

export async function resetMealPlan(this: mongoose.Model<IMealPlanner>, _id: string): Promise<void> {
    try {
        await this.updateOne({ user: new mongoose.Types.ObjectId(_id) }, {
            $set: {
                recipes: {
                    breakfast: {
                        recipe: []
                    },
                    lunch: {
                        recipe: []
                    },
                    dinner: {
                        recipe: []
                    },
                    snacks: {
                        recipe: []
                    }
                }
            }
        });
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

export async function getNutritionGoal(this: mongoose.Model<IMealPlanner>, _id: string): Promise<INutritionGoal> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) });
        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "mealPlanner not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return mealPlanner?.nutritionGoal;
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

export async function checkIfUserInitializedStats(this: mongoose.Model<IMealPlanner>, _id: string): Promise<boolean> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) });
        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "mealPlanner not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return mealPlanner?.userStats !== undefined;
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