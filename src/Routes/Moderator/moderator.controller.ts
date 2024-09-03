
import { IListResponseType, IPagination, IResponseType, IResponseWithHeaderType } from "../../Types";
import { MakeTokens, removeRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../Util/jwt";
import { IModeratorRecipeUpdateFrom, IRecipe, TRecipeStatus } from "../../Schema/Recipe/recipe.type";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import ModeratorModel from "../../Schema/Moderator/moderator.schema";
import { IModerator, IModeratorLogInFrom, IModeratorSignUpFrom, IModeratorUpdateFrom } from "../../Schema/Moderator/moderator.type";
import { moderatorLogInSchema, moderatorSignUpSchema, moderatorUpdateSchema } from "../../Schema/Moderator/moderator.validation";
import { UserType } from "../../Util/jwt/jwt.types";
import { moderatorRecipeUpdateSchema } from "../../Schema/Recipe/recipe.validation";
import { moderatorUserUpdateSchema } from "../../Schema/user/user.validation";
import UserModel from "../../Schema/user/user.schema";
import { IModeratorUserUpdateSchema } from "../../Schema/user/user.type";


export default class ModeratorController {

    static async signUp(_Moderator: IModeratorSignUpFrom): Promise<IResponseWithHeaderType<IModerator>> {

        await ModeratorModel.validator(_Moderator, moderatorSignUpSchema)
        const Moderator = await new ModeratorModel((_Moderator as any));
        await Moderator!.encryptPassword();
        await Moderator.save();
        const { accessToken, refreshToken } = await MakeTokens(Moderator.toJSON(), UserType.moderator);

        return { body: Moderator.toJSON(), header: { accessToken, refreshToken } }
    }

    static async logIn(from: IModeratorLogInFrom): Promise<IResponseWithHeaderType<IModerator>> {
        await ModeratorModel.validator(from, moderatorLogInSchema);
        const Moderator = await ModeratorModel.getByEmail(from.email);
        await Moderator!.checkPassword(from.password);

        const { accessToken, refreshToken } = await MakeTokens(Moderator!.toJSON(), UserType.moderator);
        return { body: (Moderator as any)!.toJSON(), header: { accessToken, refreshToken } }

    }

    static async refreshToken(_refreshToken: string): Promise<IResponseWithHeaderType<undefined>> {

        const tokenModerator = await verifyRefreshToken<IModerator>(_refreshToken, UserType.moderator);
        const Moderator = await ModeratorModel.getById(tokenModerator!.id);
        const { accessToken, refreshToken } = await MakeTokens(Moderator!.toJSON(), UserType.moderator);

        return { body: undefined, header: { accessToken, refreshToken } }
    }

    static async logOut(token: string): Promise<void> {
        const Moderator = await verifyAccessToken<IModerator>(token, UserType.moderator);
        await removeRefreshToken(Moderator.id);
    }

    static async update(_Moderator: IModeratorUpdateFrom, ModeratorId: string): Promise<IResponseType<IModerator | null>> {

        await ModeratorModel.validator(_Moderator, moderatorUpdateSchema)
        const Moderator = await ModeratorModel.getById(ModeratorId);
        const updateModerator = await ModeratorModel.update(Moderator.id, _Moderator)
        return { body: (updateModerator as any).toJSON() }
    }

    static async getById(ModeratorId: string = ""): Promise<IResponseType<IModerator | null>> {
        return { body: ((await ModeratorModel.getById(ModeratorId))?.toJSON() as any) };
    }

    static async removeById(ModeratorId: string, Moderator: IModerator): Promise<IResponseType<{} | null>> {
        const event = await ModeratorModel.getById(ModeratorId);
        await ModeratorModel.removeByID(event?.id)

        return { body: {} };

    }

    static async updateRecipeStatus(recipeId: string, body: IModeratorRecipeUpdateFrom, moderatorId: string): Promise<IResponseType<IRecipe | null>> {

        const moderator = await ModeratorModel.getById(moderatorId);
        await RecipeModel.validator(body, moderatorRecipeUpdateSchema);
        return { body: (await RecipeModel.addModerator(recipeId, moderator, body) as any).toJSON() }
    }

    static async updateUserStatus(userId: string, body: IModeratorUserUpdateSchema, moderatorId: string): Promise<IResponseType<IRecipe | null>> {

        await ModeratorModel.getById(moderatorId);
        await UserModel.validator(body, moderatorUserUpdateSchema);
        return { body: (await UserModel.updateUserStatus(userId, body) as any).toJSON() }
    }

    static async moderatedRecipes(moderatorId: string, status: TRecipeStatus, pagination: IPagination): Promise<IResponseType<IRecipe>> {
        return { body: await await ModeratorModel.moderatedRecipes(moderatorId, pagination, status) as any };
    }
}
