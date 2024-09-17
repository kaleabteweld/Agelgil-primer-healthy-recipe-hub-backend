import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../../Util";
import { IMealPlanner, INewMealPlanner, INutritionGoal } from "./mealPlanner.type";
import { EPreferredMealTime, ERecipeStatus, IngredientDetail, IRecipe } from "../../Recipe/recipe.type";
import { NutritionData } from "../../../Util/calorieninjas/types";



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

export async function getUserMeals(this: mongoose.Model<IMealPlanner>, _id: string, mealTime: EPreferredMealTime, page: number): Promise<{ recipe: IRecipe[]; nutrition: NutritionData }> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) }).populate({
            path: `recipes.${mealTime}.recipe`,
            match: { status: ERecipeStatus.verified },
            select: ['name', 'description', 'imgs', 'preparationDifficulty', 'preferredMealTime', "rating"],
            options: { limit: page * 10, skip: (page - 1) * 10 }
        }).exec();

        if (mealPlanner == null) {
            throw ValidationErrorFactory({
                msg: "Meal planner not found",
                statusCode: 404,
                type: "validation"
            }, "_id")
        }

        return mealPlanner?.recipes[mealTime] as any;
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
                type: "validation"
            }, "recipeId")
        }

        if (mealPlanner?.recipes[time].recipe.includes(new mongoose.Types.ObjectId(recipeId) as any)) {
            throw ValidationErrorFactory({
                msg: "User already has recipe in meal plan",
                statusCode: 400,
                type: "validation"
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
                type: "validation"
            }, "recipeId")
        }

        if (!mealPlanner?.recipes[time].recipe.includes(new mongoose.Types.ObjectId(recipeId) as any)) {
            throw ValidationErrorFactory({
                msg: "User already has recipe in meal plan",
                statusCode: 400,
                type: "validation"
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
                type: "validation"
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

export async function resetRecipes(this: mongoose.Model<IMealPlanner>, _id: string): Promise<IMealPlanner> {
    try {
        const resetNutritionGoal = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        }
        const mealPlan = await this.findOneAndUpdate({ user: new mongoose.Types.ObjectId(_id) }, {
            recipes: {
                breakfast: {
                    recipe: [],
                    nutrition: resetNutritionGoal
                },
                lunch: {
                    recipe: [],
                    nutrition: resetNutritionGoal
                },
                dinner: {
                    recipe: [],
                    nutrition: resetNutritionGoal
                },
                snacks: {
                    recipe: [],
                    nutrition: resetNutritionGoal
                }
            }
        }, { new: true });

        if (mealPlan == null) {
            throw ValidationErrorFactory({
                msg: "Meal plan not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }

        return mealPlan;
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

export async function checkIfUserIsInitialized(this: mongoose.Model<IMealPlanner>, _id: string): Promise<void> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) });
        if (mealPlanner != null) {
            throw ValidationErrorFactory({
                msg: "mealPlanner already initialized",
                statusCode: 400,
                type: "validation"
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

export async function checkIfUserHasMealPlan(this: mongoose.Model<IMealPlanner>, _id: string): Promise<IMealPlanner> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) });
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

export async function updateStats(this: mongoose.Model<IMealPlanner>, _id: string, body: INewMealPlanner): Promise<IMealPlanner> {
    try {
        const update: any = {};

        if (body.weight) {
            update.$push = {
                'userStats.weights': {
                    date: new Date(),
                    value: body.weight
                }
            };
        }

        update.$set = {
            'userStats.weight': body.weight,
            'userStats.height': body.height,
            'userStats.age': body.age,
            'userStats.gender': body.gender,
            'userStats.activityLevel': body.activityLevel,
            'userStats.diet_goals': body.diet_goals
        };

        const mealPlanner = await this.findOneAndUpdate(
            { user: new mongoose.Types.ObjectId(_id) },
            update,
            { new: true }
        ).exec();

        if (!mealPlanner) {
            throw ValidationErrorFactory({
                msg: "mealPlanner or userStats not found",
                statusCode: 404,
                type: "validationtion"
            }, "_id");
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

export async function addOrMergeShoppingListItem(this: IMealPlanner, mealTime: EPreferredMealTime, ingredient: IngredientDetail[]): Promise<IMealPlanner> {
    try {
        const shoppingList = this.recipes[mealTime].shoppingList;
        ingredient.forEach((item) => {
            const index = shoppingList.findIndex((i) => i.name === item.name);
            if (index === -1) {
                shoppingList.push(item);
            } else {
                shoppingList[index].amount += item.amount;
            }
        });
        return this;
    } catch (error) {
        throw error;
    }
}

export async function removeFromShoppingList(this: IMealPlanner, mealTime: EPreferredMealTime, ingredient: IngredientDetail[]): Promise<IMealPlanner> {
    try {
        const shoppingList = this.recipes[mealTime].shoppingList;
        ingredient.forEach((item) => {
            const index = shoppingList.findIndex((i) => i.name === item.name);
            if (index !== -1) {
                shoppingList[index].amount -= item.amount;
                if (shoppingList[index].amount <= 0) {
                    shoppingList.splice(index, 1);
                }
            }
        });
        return this;
    } catch (error) {
        throw error;
    }
}

export async function hasRecipeInMealPlan(this: IMealPlanner, mealTime: EPreferredMealTime, recipeId: string): Promise<boolean> {
    try {
        return this.recipes[mealTime].recipe.includes(new mongoose.Types.ObjectId(recipeId) as any);
    } catch (error) {
        throw error;
    }
}