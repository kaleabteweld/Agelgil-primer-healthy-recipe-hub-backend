import MealPlannerModel from "../../Schema/user/MealPlanner/mealPlanner.schema";
import { IMealPlanner, INewMealPlanner, INutritionGoal } from "../../Schema/user/MealPlanner/mealPlanner.type";
import { EPreferredMealTime, IRecipe } from "../../Schema/Recipe/recipe.type";
import { IUser } from "../../Schema/user/user.type";
import { IResponseType } from "../../Types";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { newMealPlannerSchema } from "../../Schema/user/MealPlanner/mealPlanner..validation";
import { calculateNutritionNeeds } from "../../Schema/user/MealPlanner/mealPlanner.util";
import mongoose, { mongo } from "mongoose";
import UserModel from "../../Schema/user/user.schema";


export default class MealPlannerController {

    static async createMealPlan(_user: IUser, body: INewMealPlanner): Promise<IResponseType<IMealPlanner>> {

        await MealPlannerModel.validator(body, newMealPlannerSchema);
        const user = await UserModel.getById(_user.id);

        const nutritionGoal = await calculateNutritionNeeds(body);
        const mealPlanner = new MealPlannerModel({
            user: user.id,
            nutritionGoal,
            userStats: body,
        });

        return { body: await mealPlanner.save() }
    }

    static async getMealPlan(user: IUser, mealTime: EPreferredMealTime, page: number): Promise<IResponseType<IMealPlanner | null>> {
        const mealPlanner = await MealPlannerModel.getUserMeals(user.id, mealTime, page);
        return { body: mealPlanner }
    }

    static async addToMealPlan(user: IUser, mealTime: EPreferredMealTime, recipeID: string): Promise<IResponseType<IMealPlanner>> {
        await MealPlannerModel.checkIfUserHasRecipe(user.id, mealTime, recipeID)
        const recipe = await RecipeModel.getById(recipeID);
        const mealPlanner = await MealPlannerModel.getByUser(user.id);

        mealPlanner.recipes[mealTime].recipe.push(new mongoose.Types.ObjectId(recipeID) as any);

        Object.keys(recipe.nutrition).forEach((key: any) => {
            (mealPlanner.recipes[mealTime].nutrition as any)[key] += (recipe.nutrition as any)[key];
        });

        mealPlanner.currentNutrition.calories += recipe.nutrition.calories;
        mealPlanner.currentNutrition.protein += recipe.nutrition.protein_g;
        mealPlanner.currentNutrition.carbs += recipe.nutrition.calories;
        mealPlanner.currentNutrition.fat += recipe.nutrition.fat_total_g;

        return { body: await mealPlanner.save() }
    }

    static async removeFromMealPlan(user: IUser, mealTime: EPreferredMealTime, recipeID: string): Promise<IResponseType<IMealPlanner>> {
        const mealPlanner = await MealPlannerModel.checkIfUserHasRecipe(user.id, mealTime, recipeID);
        const recipe = await RecipeModel.getById(recipeID);

        mealPlanner.recipes[mealTime].recipe = mealPlanner.recipes[mealTime].recipe.filter((id: any) => id.toString() !== recipe.id) as IRecipe[];

        Object.keys(recipe.nutrition).forEach((key: any) => {
            (mealPlanner.recipes[mealTime].nutrition as any)[key] -= (recipe.nutrition as any)[key];
        });

        mealPlanner.currentNutrition.calories -= recipe.nutrition.calories;
        mealPlanner.currentNutrition.protein -= recipe.nutrition.protein_g;
        mealPlanner.currentNutrition.carbs -= recipe.nutrition.calories;
        mealPlanner.currentNutrition.fat -= recipe.nutrition.fat_total_g;

        return { body: await mealPlanner.save() }
    }

    static async resetMealPlan(user: IUser): Promise<IResponseType<{}>> {
        await MealPlannerModel.resetMealPlan(user.id);
        return { body: {} }
    }

    static async getNutritionGoal(user: IUser): Promise<IResponseType<INutritionGoal>> {
        const nutritionGoal = await MealPlannerModel.getNutritionGoal(user.id);
        return { body: nutritionGoal }
    }

    //TODO: add edit nutrition goal


}
