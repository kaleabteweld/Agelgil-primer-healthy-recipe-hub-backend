import IngredientModel from "../../Schema/Ingredient/ingredient.schema";
import { IIngredient, IIngredientSearchFrom, INewIngredientFrom, IngredientUpdateFrom } from "../../Schema/Ingredient/ingredient.type";
import { ingredientSearchSchema, ingredientUpdateSchema, newIngredientSchema } from "../../Schema/Ingredient/ingredient.validation";
import UserModel from "../../Schema/User/user.schema";
import { IUser } from "../../Schema/User/user.type";
import { IPagination, IResponseType } from "../../Types";
import Ingredients from "../../Schema/Ingredient/ingredient.json"
import ModeratorModel from "../../Schema/Moderator/moderator.schema";
import { IngredientSearchBuilder } from "../../Schema/Ingredient/ingredient.utils";


export default class IngredientController {

    static async create(_ingredient: INewIngredientFrom, userId: string = ""): Promise<IResponseType<IIngredient>> {

        const _user = await ModeratorModel.getById(userId)
        await IngredientModel.validator(_ingredient, newIngredientSchema);
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
        const ingredientCount = await IngredientModel.countDocuments();
        if (ingredientCount === 0) {
            await IngredientModel.insertMany(Ingredients);
        }
        return { body: {} };
    }

    static async getIngredientByName(name: string = "", nameType: "name" | "localName"): Promise<IResponseType<IIngredient[]>> {
        return { body: await IngredientModel.find({ [nameType]: new RegExp(name, "i") }) }
    }

    static async getUniqueType(): Promise<IResponseType<string[]>> {
        return { body: await IngredientModel.getUniqueType() }
    }

    static async getUnitOptions(): Promise<IResponseType<string[]>> {
        return { body: await IngredientModel.getUniqueUnitOptions() }
    }

    static async update(_ingredient: IngredientUpdateFrom, ingredientId: string, userId: string = ""): Promise<IResponseType<IIngredient | null>> {

        await ModeratorModel.getById(userId)
        await IngredientModel.validator(_ingredient, ingredientUpdateSchema);
        return { body: (await IngredientModel.updateIngredient(ingredientId, _ingredient) as any).toJSON() }
    }

    static async ingredientSearch(query: IIngredientSearchFrom, page: number): Promise<IResponseType<IIngredient[]>> {
        UserModel.validator(query, ingredientSearchSchema);
        return { body: await (await IngredientSearchBuilder.fromJSON(query)).withPagination(page).execute() };
    }


}
