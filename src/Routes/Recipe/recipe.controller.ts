import { IModerator } from "../../Schema/Moderator/moderator.type";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { ERecipeStatus, INewRecipeFrom, IRecipe, IRecipeSearchFrom, IRecipeUpdateFrom } from "../../Schema/Recipe/recipe.type";
import { RecipeSearchBuilder } from "../../Schema/Recipe/recipe.utils";
import { newRecipeSchema, recipeSearchSchema, recipeUpdateSchema } from "../../Schema/Recipe/recipe.validation";
import UserModel from "../../Schema/user/user.schema";
import { IUser } from "../../Schema/user/user.type";
import { IPagination, IResponseType } from "../../Types";
import Calorieninjas from "../../Util/calorieninjas";
import { NutritionData } from "../../Util/calorieninjas/types";


export default class RecipeController {

    static async create(_recipe: INewRecipeFrom, user: IUser): Promise<IResponseType<IRecipe>> {

        const _user = await UserModel.getById(user.id as any)
        await RecipeModel.validator(_recipe, newRecipeSchema);

        _recipe = {
            ..._recipe,
            user: {
                user: _user?._id,
                profile_img: _user?.profile_img,
                full_name: _user?.full_name
            }
        } as any;

        const recipe = await new RecipeModel((_recipe));
        await recipe.save();

        return { body: (recipe.toJSON() as any) }
    }

    static async list({ skip, limit }: IPagination): Promise<IResponseType<IRecipe[]>> {
        return {
            body: await RecipeModel.find()
                .skip(skip ?? 0)
                .limit(limit ?? 0)
                .sort({ createdAt: -1 })
                .exec()
        }
    }

    static async update(_recipe: IRecipeUpdateFrom, recipeId: string, user: IUser): Promise<IResponseType<IRecipe | null>> {

        await RecipeModel.validator(_recipe, recipeUpdateSchema);
        const recipe = await RecipeModel.checkIfUserOwnsRecipe(recipeId, await UserModel.getById(user.id as any));
        const updateRecipe = await RecipeModel.update(recipe.id, _recipe)
        return { body: (updateRecipe as any).toJSON() }
    }

    static async getById(recipeId: string = ""): Promise<IResponseType<IRecipe | null>> {
        return { body: ((await RecipeModel.getById(recipeId))?.toJSON() as any) };
    }

    static async removeById(recipeId: string, user: IUser): Promise<IResponseType<{} | null>> {
        const recipe = await RecipeModel.checkIfUserOwnsRecipe(recipeId, await UserModel.getById(user.id as any));
        await RecipeModel.removeByID(recipe?.id)

        return { body: {} };

    }

    static async carbs(recipeId: string): Promise<IResponseType<NutritionData | null>> {
        const recipe = await RecipeModel.getById(recipeId);
        const calorieninjas: Calorieninjas = new Calorieninjas({ apiKey: process.env.CALORIENINJAS_API_KEY ?? "" })
        return { body: await calorieninjas.getNutritionData(recipe.name) }
    }

    static async search(searchFrom: IRecipeSearchFrom, page: number = 1): Promise<IResponseType<IRecipe[]>> {
        RecipeModel.validator(searchFrom, recipeSearchSchema);
        return {
            body: await ((await RecipeSearchBuilder.fromJSON(searchFrom, recipeSearchSchema)).withPagination(page)).execute()

        }
    }

    static async recommendation(user: IUser, { skip, limit }: IPagination): Promise<IResponseType<IRecipe[]>> {
        const _user = await UserModel.getById(user.id as any)
        return {
            body: await RecipeModel.find({ user: _user?._id })
                .skip(skip ?? 0)
                .limit(limit ?? 0)
                .exec()
        }
    }

    static async similar(recipeId: string, { skip, limit }: IPagination): Promise<IResponseType<IRecipe[]>> {
        const recipe = await RecipeModel.getById(recipeId);
        return {
            body: await RecipeModel.similarRecipes(recipe.recipeEmbedding, { skip, limit })
        }
    }
}
