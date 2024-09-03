import { IUser, IUserLogInFrom, IUserSearchFrom, IUserSignUpFrom, IUserUpdateFrom } from "../../Schema/user/user.type";
import UserModel from "../../Schema/user/user.schema";
import { IListResponseType, IPagination, IResponseType, IResponseWithHeaderType } from "../../Types";
import { MakeTokens, removeRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../Util/jwt";
import { UserType } from "../../Util/jwt/jwt.types";
import { userLogInSchema, userSearchSchema, userSignUpSchema, userUpdateSchema } from "../../Schema/user/user.validation";
import { IRecipe, TRecipeStatus } from "../../Schema/Recipe/recipe.type";
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import { UserSearchBuilder } from "../../Schema/user/user.utils";


export default class UserController {

    static async signUp(_user: IUserSignUpFrom): Promise<IResponseWithHeaderType<IUser>> {

        await UserModel.validator(_user, userSignUpSchema)
        const user = await new UserModel((_user as any));
        await user!.encryptPassword();
        await user.save();
        const { accessToken, refreshToken } = await MakeTokens(user.toJSON(), UserType.user);

        return { body: user.toJSON(), header: { accessToken, refreshToken } }
    }

    static async logIn(from: IUserLogInFrom): Promise<IResponseWithHeaderType<IUser>> {
        await UserModel.validator(from, userLogInSchema);
        const user = await UserModel.getByEmail(from.email);
        await user!.checkPassword(from.password);

        const { accessToken, refreshToken } = await MakeTokens(user!.toJSON(), UserType.user);
        return { body: user!.toJSON() as any, header: { accessToken, refreshToken } }

    }

    static async refreshToken(_refreshToken: string): Promise<IResponseWithHeaderType<undefined>> {

        const tokenUser = await verifyRefreshToken<IUser>(_refreshToken, UserType.user);
        const user = await UserModel.getById(tokenUser!.id);
        const { accessToken, refreshToken } = await MakeTokens(user!.toJSON(), UserType.user);

        return { body: undefined, header: { accessToken, refreshToken } }
    }

    static async logOut(token: string): Promise<void> {
        const user = await verifyAccessToken<IUser>(token, UserType.user);
        await removeRefreshToken(user.id);
    }

    static async update(_user: IUserUpdateFrom, userId: string): Promise<IResponseType<IUser | null>> {

        await UserModel.validator(_user, userUpdateSchema)
        const user = await UserModel.getById(userId);
        const updateUser = await UserModel.update(user.id, _user)
        return { body: (updateUser as any).toJSON() }
    }

    static async getById(userId: string = ""): Promise<IResponseType<IUser | null>> {
        return { body: ((await UserModel.getById(userId))?.toJSON() as any) };
    }

    static async removeById(userId: string, user: IUser): Promise<IResponseType<{} | null>> {
        const event = await UserModel.getById(userId);
        await UserModel.removeByID(event?.id)

        return { body: {} };

    }

    static async bookedRecipes(userId: string, pagination: IPagination): Promise<IResponseType<IRecipe[]>> {
        return { body: await UserModel.getBookedRecipes(userId, pagination) };
    }

    static async toggleBookedRecipes(userId: string, recipeId: string): Promise<IResponseType<IRecipe[]>> {
        const recipe = await RecipeModel.getById(recipeId);
        return { body: await UserModel.toggleBookedRecipes(userId, recipe) };
    }

    static async myRecipes(userId: string, status: TRecipeStatus, pagination: IPagination): Promise<IResponseType<IRecipe[]>> {
        return { body: await UserModel.getMyRecipes(userId, pagination, status) };
    }

    static async users(page: number, verified: boolean = false): Promise<IResponseType<IUser[]>> {
        return { body: await UserModel.find({ verified }).skip(page * 10).limit(10).exec() };
    }

    static async usersSearch(query: IUserSearchFrom, page: number): Promise<IResponseType<IUser[]>> {
        UserModel.validator(query, userSearchSchema);
        return { body: await (await UserSearchBuilder.fromJSON(query)).withPagination(page).execute() };
    }
}
