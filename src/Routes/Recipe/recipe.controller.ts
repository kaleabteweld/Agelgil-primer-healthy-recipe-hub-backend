import IngredientModel from "../../Schema/Ingredient/ingredient.schema";
import ModeratorModel from "../../Schema/Moderator/moderator.schema";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { EPreferredMealTime, ERecipeStatus, INewRecipeFrom, IRecipe, IRecipeSearchFrom, IRecipeUpdateFrom, TPreferredMealTime } from "../../Schema/Recipe/recipe.type";
import { RecipeSearchBuilder } from "../../Schema/Recipe/recipe.utils";
import { newRecipeSchema, recipeSearchSchema, recipeUpdateSchema } from "../../Schema/Recipe/recipe.validation";
import UserModel from "../../Schema/user/user.schema";
import { EXpType, IUser } from "../../Schema/user/user.type";
import { IPagination, IResponseType } from "../../Types";
import Calorieninjas from "../../Util/calorieninjas";
import { NutritionData } from "../../Util/calorieninjas/types";
import { Datasx } from "../../Util/Datasx";
import Neo4jClient from "../../Util/Neo4j/neo4jClient";


export default class RecipeController {

    static async getIngredients(_recipe: IRecipeUpdateFrom): Promise<{
        name?: string,
        type?: string,
        localName?: string,
        amount: number
        unit: string
    }[]> {
        const ingredients: any = []

        for (const { ingredient, amount, unit } of _recipe?.ingredients ?? []) {
            const ingredientData = await IngredientModel.findById(ingredient, { name: 1, type: 1, localName: 1 });
            ingredients.push({ ...ingredientData?.toJSON(), amount, unit });
        }
        return ingredients;
    }

    static async create(_recipe: INewRecipeFrom, user: IUser): Promise<IResponseType<IRecipe>> {

        const _user = await UserModel.getById(user.id as any)
        await RecipeModel.validator(_recipe, newRecipeSchema);
        const ingredients = await RecipeController.getIngredients(_recipe)


        _recipe = {
            ..._recipe,
            nutrition: await Calorieninjas.getInstance().getNutrition(ingredients),
            ingredients: ingredients,
            user: {
                user: _user?._id,
                profile_img: _user?.profile_img,
                full_name: _user?.full_name
            }
        } as any;

        const recipe = await new RecipeModel((_recipe));
        await recipe.save();

        const recipeOwner = await RecipeModel.getRecipesOwner(recipe.id as any);
        if (recipeOwner) {
            await recipeOwner.addXp(EXpType.addRecipe);
        }

        return { body: (recipe.toJSON() as any) }
    }

    static async list({ skip, limit }: IPagination, filter: EPreferredMealTime | "all" = "all"): Promise<IResponseType<IRecipe[]>> {
        if (filter === "all") {
            return {
                body: await RecipeModel.find()
                    .skip(skip ?? 0)
                    .limit(limit ?? 0)
                    .sort({ createdAt: -1 })
                    .exec()
            }
        } else
            return {
                body: await RecipeModel.find({
                    preferredMealTime: { $in: filter },
                })
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
                    .select({ name: 1, description: 1, imgs: 1, preparationDifficulty: 1, preferredMealTime: 1, rating: 1, status: 1 })
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
                .select({ name: 1, description: 1, imgs: 1, preparationDifficulty: 1, preferredMealTime: 1, rating: 1, status: 1 })
                .sort({ createdAt: -1 })
                .exec()
        }
    }

    static async update(_recipe: IRecipeUpdateFrom, recipeId: string, user: IUser): Promise<IResponseType<IRecipe | null>> {

        await RecipeModel.validator(_recipe, recipeUpdateSchema);
        const recipe = await RecipeModel.checkIfUserOwnsRecipe(recipeId, await UserModel.getById(user.id as any));
        const ingredients = await RecipeController.getIngredients(_recipe)

        _recipe = {
            ..._recipe,
            nutrition: await Calorieninjas.getInstance().getNutrition(ingredients),
            ingredients: ingredients,
        } as any;

        const updateRecipe: any = await RecipeModel.update(recipe.id, _recipe)
        if (recipe.status === ERecipeStatus.verified) {
            updateRecipe.status = ERecipeStatus.pending
            await updateRecipe.save()
        } else {
            await Datasx.getInstance().updateRecipe(recipeId, updateRecipe);
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
        return {
            body: {
                ..._recipe,
                hasBookedRecipe: user.hasBookedRecipe(recipeId),
                ownsRecipe: user.ownsRecipe(recipeId)
            } as any
        };
    }

    static async getByIdWithModerator(recipeId: string, userId: string): Promise<IResponseType<IRecipe | null>> {
        const user = await ModeratorModel.getById(userId)
        const recipe = await RecipeModel.getById(recipeId, ["reviews"]);
        const _recipe = recipe?.toJSON() as any;
        return {
            body: {
                ..._recipe,
                isModeratedRecipe: user.hasModeratedRecipe(recipe._id as any)
            } as any
        };
    }

    static async removeById(recipeId: string, user: IUser): Promise<IResponseType<{} | null>> {
        const recipe = await RecipeModel.checkIfUserOwnsRecipe(recipeId, (await UserModel.getById(user.id as any)));
        await RecipeModel.removeByID(recipe?.id)
        await Datasx.getInstance().removeRecipe(recipe as any)
        await Neo4jClient.getInstance({}).removeRecipe(recipe as any)
        return { body: {} };

    }

    /* istanbul ignore file */
    static async carbs(recipeId: string): Promise<IResponseType<NutritionData | null>> {
        const recipe = await RecipeModel.getById(recipeId);
        const calorieninjas: Calorieninjas = Calorieninjas.getInstance();
        return {
            body: (await calorieninjas.getTotalNutrition(recipe.ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`).join(",")))
        }
    }

    /* istanbul ignore file */
    static async search(searchFrom: IRecipeSearchFrom, page: number = 1): Promise<IResponseType<IRecipe[]>> {
        await RecipeModel.validator(searchFrom, recipeSearchSchema);
        return {
            body: await ((await RecipeSearchBuilder.fromJSON(searchFrom, recipeSearchSchema)).withPagination(page).withStatus(ERecipeStatus.verified)).execute()

        }
    }

    /* istanbul ignore file */
    static async moderatorSearch(searchFrom: IRecipeSearchFrom, page: number = 1): Promise<IResponseType<IRecipe[]>> {
        await RecipeModel.validator(searchFrom, recipeSearchSchema);
        return {
            body: await ((await RecipeSearchBuilder.fromJSON(searchFrom, recipeSearchSchema)).withPagination(page)).execute()

        }
    }

    /* istanbul ignore file */
    static async recommendation(user: IUser, time: TPreferredMealTime, pagination: IPagination): Promise<IResponseType<IRecipe[]>> {
        const _user = await UserModel.getById(user.id as any)
        const recommendations = await (Neo4jClient.getInstance({}).recommendRecipesForUser(_user.id as any, time, pagination));
        console.log({ recommendations })
        for (const recipe of recommendations) {
            recipe._id = recipe.id
            recipe.imgs = await RecipeModel.getRecipeImages(recipe.id)
        }
        return {
            body: recommendations
        }
    }

    /* istanbul ignore file */
    static async similar(recipeId: string, page: number): Promise<IResponseType<IRecipe[]>> {
        const recipe = await RecipeModel.getById(recipeId);
        return {
            body: await Datasx.getInstance().getSuggestionsForRecipe(recipe, page)
        }
    }

    /* istanbul ignore file */
    static async addEmbedding(recipeId: string): Promise<IResponseType<IRecipe | null>> {
        const recipe = await RecipeModel.getById(recipeId);
        await Datasx.getInstance().EmbedAndSave(recipe as any);
        return { body: recipe }
    }
}
