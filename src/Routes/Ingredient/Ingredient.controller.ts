import IngredientModel from "../../Schema/Ingredient/ingredient.schema";
import { IIngredient, INewIngredientFrom } from "../../Schema/Ingredient/ingredient.type";
import { newIngredientSchema } from "../../Schema/Ingredient/ingredient.validation";
import UserModel from "../../Schema/user/user.schema";
import { IUser } from "../../Schema/user/user.type";
import { IPagination, IResponseType } from "../../Types";
import Ingredients from "../../Schema/Ingredient/ingredient.json"


export default class IngredientController {

    static async create(_ingredient: INewIngredientFrom, user: IUser): Promise<IResponseType<IIngredient>> {

        const _user = await UserModel.getById(user._id as any)
        await IngredientModel.validator(_ingredient, newIngredientSchema);

        _ingredient = {
            ..._ingredient,
            user: {
                user: _user?._id,
                profile_img: _user?.profile_img,
                full_name: _user?.full_name
            }
        } as any;

        const Ingredient = await new IngredientModel((_ingredient));
        await Ingredient.save();

        return { body: (Ingredient.toJSON() as any) }
    }

    static async list({ skip, limit }: IPagination): Promise<IResponseType<IIngredient[]>> {
        return {
            body: await IngredientModel.find()
                .skip(skip ?? 0)
                .limit(limit ?? 0)
                .exec()
        }
    }

    static async getById(ingredientId: string = ""): Promise<IResponseType<IIngredient | null>> {
        return { body: ((await IngredientModel.getById(ingredientId))?.toJSON() as any) };
    }

    static async removeById(ingredientId: string, user: IIngredient): Promise<IResponseType<{} | null>> {
        const Ingredient = await IngredientModel.getById(ingredientId);
        await IngredientModel.removeByID(Ingredient?.id)

        return { body: {} };

    }

    static async seed(): Promise<IResponseType<{}>> {
        // insert ingredients if not exists
        await IngredientModel.deleteMany({});
        await IngredientModel.insertMany(Ingredients.ingredients);
        return { body: {} };
    }

}
