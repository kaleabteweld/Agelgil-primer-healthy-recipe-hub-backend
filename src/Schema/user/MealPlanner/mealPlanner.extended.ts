import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../../Util";
import { IMealPlanner, INewMealPlanner, INutritionGoal } from "./mealPlanner.type";
import { EPreferredMealTime, IngredientDetail } from "../../Recipe/recipe.type";
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

export async function getUserMeals(this: mongoose.Model<IMealPlanner>, _id: string, mealTime: EPreferredMealTime, page: number): Promise<{ recipes: mongoose.Schema.Types.ObjectId; mealTime: EPreferredMealTime; }[]> {
    try {
        const mealPlanner = await this.findOne({ user: new mongoose.Types.ObjectId(_id) }).populate({
            path: `recipes.recipe`,
            // match: { status: ERecipeStatus.verified },
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

        return mealPlanner?.recipes.filter((recipe) => recipe.mealTime === mealTime) as any;
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

export async function checkIfUserHasRecipe(this: mongoose.Model<IMealPlanner>, _id: string, recipeId: string): Promise<IMealPlanner> {
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

        if (mealPlanner?.recipes.filter((recipe) => new mongoose.Types.ObjectId(recipeId).equals(recipe.recipe as any)).length > 0) {
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

export async function checkIfUserDoseNotRecipe(this: mongoose.Model<IMealPlanner>, _id: string, recipeId: string): Promise<IMealPlanner> {
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

        if ((mealPlanner?.recipes.filter((recipe) => new mongoose.Types.ObjectId(recipeId).equals(recipe.recipe as any)).length == 0)) {
            throw ValidationErrorFactory({
                msg: "User does not have recipe in meal plan",
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

export async function removeRecipeFromMealPlan(this: mongoose.Model<IMealPlanner>, _id: string, recipeId: string): Promise<void> {
    try {
        const result = await this.updateOne({ user: new mongoose.Types.ObjectId(_id) }, {
            $pull: {
                [`recipes.recipe`]: new mongoose.Types.ObjectId(recipeId)
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
        const mealPlan = await this.findOneAndUpdate({ user: new mongoose.Types.ObjectId(_id) }, {
            recipes: [],
            shoppingList: [],
            nutrition: {
                sugar_g: 0,
                fiber_g: 0,
                serving_size_g: 0,
                sodium_mg: 0,
                potassium_mg: 0,
                fat_saturated_g: 0,
                fat_total_g: 0,
                calories: 0,
                cholesterol_mg: 0,
                protein_g: 0,
                carbohydrates_total_g: 0,
            } as NutritionData
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
                type: "validation"
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

export async function addOrMergeShoppingListItem(this: IMealPlanner, ingredient: IngredientDetail[]): Promise<IMealPlanner> {
    try {
        const shoppingList = this.shoppingList;
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

export async function removeFromShoppingList(this: IMealPlanner, ingredient: IngredientDetail[]): Promise<IMealPlanner> {
    try {
        const shoppingList = this.shoppingList;
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

export async function hasRecipeInMealPlan(this: IMealPlanner, recipeId: any): Promise<boolean> {
    try {
        return this.recipes.filter((recipe) => recipe.recipe == recipeId).length > 0;
    } catch (error) {
        throw error;
    }
}