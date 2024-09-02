import IngredientModel from "../../Schema/Ingredient/ingredient.schema";
import { IIngredient } from "../../Schema/Ingredient/ingredient.type";
import ModeratorModel from "../../Schema/Moderator/moderator.schema";
import { IModerator } from "../../Schema/Moderator/moderator.type";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { EPreferredMealTime, ERecipeStatus, INewRecipeFrom, IRecipe, IRecipeSearchFrom, IRecipeUpdateFrom, TPreferredMealTime } from "../../Schema/Recipe/recipe.type";
import { RecipeSearchBuilder } from "../../Schema/Recipe/recipe.utils";
import { newRecipeSchema, recipeSearchSchema, recipeUpdateSchema } from "../../Schema/Recipe/recipe.validation";
import UserModel from "../../Schema/user/user.schema";
import { IUser } from "../../Schema/user/user.type";
import { IPagination, IResponseType } from "../../Types";
import Calorieninjas from "../../Util/calorieninjas";
import { NutritionData } from "../../Util/calorieninjas/types";
import { Datasx } from "../../Util/Datasx";


export default class RecipeController {

    static async create(_recipe: INewRecipeFrom, user: IUser): Promise<IResponseType<IRecipe>> {

        const _user = await UserModel.getById(user.id as any)
        await RecipeModel.validator(_recipe, newRecipeSchema);

        const ingredients: {
            name?: string,
            type?: string,
            localName?: string,
            amount: number
            unit: string
        }[] = await Promise.all(_recipe.ingredients.map(async ({ ingredient, amount, unit }) => {
            return { ...(await IngredientModel.findById(ingredient, { name: 1, type: 1, localName: 1 })), amount, unit }
        }))

        _recipe = {
            ..._recipe,
            nutrition: await (new Calorieninjas({ apiKey: process.env.CALORIENINJAS_API_KEY ?? "" }))
                .getTotalNutrition(ingredients
                    .map((ingredient) => `${ingredient.amount} ${ingredient.name}`).join(",")),

            ingredients: ingredients,
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

    static async moderatoList({ skip, limit }: IPagination, filter: EPreferredMealTime | "all" = "all"): Promise<IResponseType<IRecipe[]>> {

        if (filter === "all") {
            return {
                body: await RecipeModel.find({
                    status: ERecipeStatus.pending,
                })
                    .skip(skip ?? 0)
                    .limit(limit ?? 0)
                    .sort({ createdAt: -1 })
                    .exec()
            }
        }
        return {
            body: await RecipeModel.find({
                $and: [{
                    preferredMealTime: { $in: filter },
                    status: ERecipeStatus.pending
                }]
            })
                .skip(skip ?? 0)
                .limit(limit ?? 0)
                .sort({ createdAt: -1 })
                .exec()
        }
    }

    static async update(_recipe: IRecipeUpdateFrom, recipeId: string, user: IUser): Promise<IResponseType<IRecipe | null>> {

        await RecipeModel.validator(_recipe, recipeUpdateSchema);
        const recipe = await RecipeModel.checkIfUserOwnsRecipe(recipeId, await UserModel.getById(user.id as any));
        const updateRecipe: any = await RecipeModel.update(recipe.id, _recipe)
        if (recipe.status === ERecipeStatus.rejected) {
            updateRecipe.status = ERecipeStatus.pending
            await updateRecipe.save()
        }
        return { body: updateRecipe.toJSON() }
    }

    static async getById(recipeId: string = ""): Promise<IResponseType<IRecipe | null>> {
        return { body: ((await RecipeModel.getById(recipeId, ["reviews"]))?.toJSON() as any) };
    }

    static async getByIdWithUser(recipeId: string, userId: string): Promise<IResponseType<IRecipe | null>> {
        const user = await UserModel.getById(userId)
        const recipe = await RecipeModel.getById(recipeId, ["reviews"]);
        const _recipe = recipe?.toJSON() as any;
        return { body: { ..._recipe, hasBookedRecipe: user.hasBookedRecipe(recipeId) } as any };
    }

    static async getByIdWithModerator(recipeId: string, userId: string): Promise<IResponseType<IRecipe | null>> {
        const user = await ModeratorModel.getById(userId)
        const recipe = await RecipeModel.getById(recipeId, ["reviews"]);
        const _recipe = recipe?.toJSON() as any;
        return { body: { ..._recipe, isModeratedRecipe: user.hasModeratedRecipe(recipe._id as any) } as any };
    }

    static async removeById(recipeId: string, user: IUser): Promise<IResponseType<{} | null>> {
        const recipe = await RecipeModel.checkIfUserOwnsRecipe(recipeId, await UserModel.getById(user.id as any));
        await RecipeModel.removeByID(recipe?.id)
        await Datasx.getInstance().removeRecipe(recipe as any)
        return { body: {} };

    }

    static async carbs(recipeId: string): Promise<IResponseType<NutritionData | null>> {
        const recipe = await RecipeModel.getById(recipeId);
        const calorieninjas: Calorieninjas = new Calorieninjas({ apiKey: process.env.CALORIENINJAS_API_KEY ?? "" })
        return {
            body: (await calorieninjas.getTotalNutrition(recipe.ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.name}`).join(",")))
        }
    }

    static async search(searchFrom: IRecipeSearchFrom, page: number = 1): Promise<IResponseType<IRecipe[]>> {
        await RecipeModel.validator(searchFrom, recipeSearchSchema);
        return {
            body: await ((await RecipeSearchBuilder.fromJSON(searchFrom, recipeSearchSchema)).withPagination(page).withStatus(ERecipeStatus.verified)).execute()

        }
    }

    static async moderatorSearch(searchFrom: IRecipeSearchFrom, page: number = 1): Promise<IResponseType<IRecipe[]>> {
        await RecipeModel.validator(searchFrom, recipeSearchSchema);
        return {
            body: await ((await RecipeSearchBuilder.fromJSON(searchFrom, recipeSearchSchema)).withPagination(page)).execute()

        }
    }

    static async recommendation(user: IUser, time: TPreferredMealTime, { skip, limit }: IPagination): Promise<IResponseType<IRecipe[]>> {
        const _user = await UserModel.getById(user.id as any)
        return {
            body: await RecipeModel.find({ user: _user?.id })
                .skip(skip ?? 0)
                .limit(limit ?? 0)
                .exec()
        }
    }

    static async similar(recipeId: string, page: number): Promise<IResponseType<IRecipe[]>> {
        const recipe = await RecipeModel.getById(recipeId);
        return {
            body: await Datasx.getInstance().getSuggestionsForRecipe(recipe, page)
        }
    }

    static async addEmbedding(recipeId: string): Promise<IResponseType<IRecipe | null>> {
        const recipe = await RecipeModel.getById(recipeId);
        await Datasx.getInstance().EmbedAndSave(recipe as any);
        return { body: recipe }
    }
}
