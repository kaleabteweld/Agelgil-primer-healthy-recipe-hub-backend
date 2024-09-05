import MealPlannerModel from "../../Schema/User/MealPlanner/mealPlanner.schema";
import { IMealPlanner } from "../../Schema/User/MealPlanner/mealPlanner.type";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { EPreferredMealTime } from "../../Schema/Recipe/recipe.type";
import { IUser } from "../../Schema/User/user.type";
import { IPagination, IResponseType } from "../../Types";


export default class MealPlannerController {

    static async list({ skip, limit }: IPagination): Promise<IResponseType<IMealPlanner[]>> {
        return {
            body: await MealPlannerModel.find()
                .skip(skip ?? 0)
                .limit(limit ?? 0)
                .sort({ createdAt: -1 })
                .exec()
        }
    }

    static async getById(mealPlannerId: string = ""): Promise<IResponseType<IMealPlanner | null>> {
        return { body: ((await MealPlannerModel.getById(mealPlannerId))?.toJSON() as any) };
    }

    static async removeByID(mealPlannerId: string, user: IUser): Promise<IResponseType<{} | null>> {
        await MealPlannerModel.checkIfUserOwnsMealPlanner(mealPlannerId, user);
        await MealPlannerModel.removeByID(mealPlannerId);
        return { body: {} };
    }

    static async add(user: IUser, mealPlannerId: string, mealTime: EPreferredMealTime, recipeId: string): Promise<IResponseType<IMealPlanner>> {
        const mealPlanner = await MealPlannerModel.getById(mealPlannerId);
        await MealPlannerModel.checkIfUserOwnsMealPlanner(mealPlannerId, user);
        await mealPlanner.addToMealPlanner(mealTime, await RecipeModel.getById(recipeId));
        return { body: mealPlanner };
    }

    static async removeFromMealPlanner(user: IUser, mealPlannerId: string, mealTime: EPreferredMealTime, recipeId: string): Promise<IResponseType<IMealPlanner>> {
        const mealPlanner = await MealPlannerModel.getById(mealPlannerId);
        await MealPlannerModel.checkIfUserOwnsMealPlanner(mealPlannerId, user);
        await mealPlanner.removeFromMealPlanner(mealTime, await RecipeModel.getById(recipeId));
        return { body: mealPlanner };
    }

}
