import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { INewRecipeFrom, IRecipe, IRecipeUpdateFrom } from "../../Schema/Recipe/recipe.type";
import { newRecipeSchema, recipeUpdateSchema } from "../../Schema/Recipe/recipe.validation";
import UserModel from "../../Schema/user/user.schema";
import { IUser } from "../../Schema/user/user.type";
import { IPagination, IResponseType } from "../../Types";


export default class RecipeController {

    static async create(_recipe: INewRecipeFrom, user: IUser): Promise<IResponseType<IRecipe>> {

        const _user = await UserModel.getById(user._id as any)
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
                .exec()
        }
    }

    static async update(_recipe: IRecipeUpdateFrom, recipeId: string): Promise<IResponseType<IRecipe | null>> {

        await RecipeModel.validator(_recipe, recipeUpdateSchema)
        const recipe = await RecipeModel.getById(recipeId);
        const updateRecipe = await RecipeModel.update(recipe.id, _recipe)
        return { body: (updateRecipe as any).toJSON() }
    }

    static async getById(recipeId: string = ""): Promise<IResponseType<IRecipe | null>> {
        return { body: ((await RecipeModel.getById(recipeId))?.toJSON() as any) };
    }

    static async removeById(recipeId: string, user: IRecipe): Promise<IResponseType<{} | null>> {
        const event = await RecipeModel.getById(recipeId);
        await RecipeModel.removeByID(event?.id)

        return { body: {} };

    }

}
