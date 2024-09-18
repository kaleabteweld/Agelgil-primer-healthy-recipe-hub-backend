import MealPlannerModel from "../../Schema/user/MealPlanner/mealPlanner.schema";
import { IMealPlanner, INewMealPlanner, INutritionGoal } from "../../Schema/user/MealPlanner/mealPlanner.type";
import { EPreferredMealTime, IngredientDetail, IRecipe } from "../../Schema/Recipe/recipe.type";
import { IUser } from "../../Schema/user/user.type";
import { IResponseType } from "../../Types";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { newMealPlannerSchema, updateMealPlannerSchema } from "../../Schema/user/MealPlanner/mealPlanner..validation";
import { calculateNutritionNeeds } from "../../Schema/user/MealPlanner/mealPlanner.util";
import mongoose from "mongoose";
import UserModel from "../../Schema/user/user.schema";
import { NutritionData } from "../../Util/calorieninjas/types";
import { Datasx } from "../../Util/Datasx";


export default class MealPlannerController {

    static async createMealPlan(_user: IUser, body: INewMealPlanner): Promise<IResponseType<IMealPlanner>> {

        await MealPlannerModel.validator(body, newMealPlannerSchema);
        await MealPlannerModel.checkIfUserIsInitialized(_user.id);
        const user = await UserModel.getById(_user.id);

        const nutritionGoal = await calculateNutritionNeeds(body);
        const mealPlanner = new MealPlannerModel({
            user: user.id,
            nutritionGoal,
            userStats: {
                ...body, weights: {
                    date: new Date(),
                    value: body.weight
                }
            },
        });

        return { body: await mealPlanner.save() }
    }

    static async getMealPlan(user: IUser, mealTime: EPreferredMealTime, page: number): Promise<IResponseType<{ recipe: IRecipe[]; nutrition: NutritionData } | null>> {
        const mealPlanner = await MealPlannerModel.getUserMeals(user.id, mealTime, page);
        return { body: mealPlanner }
    }

    static async addToMealPlan(user: IUser, mealTime: EPreferredMealTime, recipeID: string): Promise<IResponseType<IMealPlanner>> {
        await MealPlannerModel.checkIfUserHasRecipe(user.id, recipeID)
        const recipe = await RecipeModel.getById(recipeID);
        const mealPlanner = await MealPlannerModel.getByUser(user.id);

        mealPlanner.recipes.push({ recipe: recipeID as any, mealTime });

        Object.keys(recipe.nutrition).forEach((key: any) => {
            (mealPlanner.nutrition as any)[key] += (recipe.nutrition as any)[key];
        });

        mealPlanner.currentNutrition.calories += recipe.nutrition.calories;
        mealPlanner.currentNutrition.protein += recipe.nutrition.protein_g;
        mealPlanner.currentNutrition.carbs += recipe.nutrition.calories;
        mealPlanner.currentNutrition.fat += recipe.nutrition.fat_total_g;

        mealPlanner.addOrMergeShoppingListItem(recipe.ingredients);

        return { body: await mealPlanner.save() }
    }

    static async removeFromMealPlan(user: IUser, recipeID: string): Promise<IResponseType<IMealPlanner>> {
        const mealPlanner = await MealPlannerModel.checkIfUserDoseNotRecipe(user.id, recipeID);
        const recipe = await RecipeModel.getById(recipeID);

        mealPlanner.recipes = mealPlanner.recipes.filter(recipe => recipe.recipe.toString() !== recipeID);

        Object.keys(recipe.nutrition).forEach((key: any) => {
            (mealPlanner.nutrition as any)[key] -= (recipe.nutrition as any)[key];
        });

        mealPlanner.currentNutrition.calories -= recipe.nutrition.calories;
        mealPlanner.currentNutrition.protein -= recipe.nutrition.protein_g;
        mealPlanner.currentNutrition.carbs -= recipe.nutrition.calories;
        mealPlanner.currentNutrition.fat -= recipe.nutrition.fat_total_g;

        console.log("herr")
        mealPlanner.removeFromShoppingList(recipe.ingredients);

        return { body: await mealPlanner.save() }
    }

    static async resetRecipes(user: IUser): Promise<IResponseType<{}>> {
        return { body: await MealPlannerModel.resetRecipes(user.id) }
    }

    static async getNutritionGoal(user: IUser): Promise<IResponseType<INutritionGoal>> {
        const nutritionGoal = await MealPlannerModel.getNutritionGoal(user.id);
        return { body: nutritionGoal }
    }

    static async updateStats(user: IUser, body: INewMealPlanner): Promise<IResponseType<IMealPlanner>> {
        await MealPlannerModel.validator(body, updateMealPlannerSchema)
        return { body: await MealPlannerModel.updateStats(user.id, body) }
    }

    static async getShoppingList(user: IUser): Promise<IResponseType<IngredientDetail[]>> {
        const mealPlanner = await MealPlannerModel.getByUser(user.id);
        return { body: mealPlanner.shoppingList }
    }

    static async getSimilarRecipes(user: IUser, mealTime: EPreferredMealTime, page: number): Promise<IResponseType<IRecipe[]>> {
        const mealPlanner = await MealPlannerModel.getUserMeals(user.id, mealTime, (page + 1));
        const recipes = await RecipeModel.getRecipes(mealPlanner.recipe.map(recipe => recipe.id));
        const SuggestedRecipes = await Datasx.getInstance().getSuggestionsForRecipes(recipes, page)
        return { body: SuggestedRecipes as IRecipe[] }
    }

    static async checkIfUserHasRecipe(user: IUser, recipeID: string): Promise<IResponseType<{ isRecipeInMealPlan: boolean }>> {
        const mealPlanner = await MealPlannerModel.getByUser(user.id);
        return {
            body: {
                isRecipeInMealPlan: await mealPlanner.hasRecipeInMealPlan(recipeID)
            }
        }
    }

}
