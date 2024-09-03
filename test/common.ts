import { Response } from "supertest";
import { expect } from '@jest/globals';
import { UserType } from "../src/Util/jwt/jwt.types";
import { EAllergies, EChronicDisease, EDietaryPreferences, IUser, IUserLogInFrom, IUserSignUpFrom } from "../src/Schema/user/user.type";
import { IModerator, IModeratorLogInFrom, IModeratorSignUpFrom } from "../src/Schema/Moderator/moderator.type";
import { IIngredient, INewIngredientFrom } from "../src/Schema/Ingredient/ingredient.type";
import { INewRecipeFrom, IRecipe } from "../src/Schema/Recipe/recipe.type";


export const sighupUrl = (user: UserType) => `/Api/v1/public/authentication/${user}/signUp`;
export const privateSighupUrl = (user: UserType = UserType.admin) => `/Api/v1/private/authentication/${user}/signUp`;
export const loginUrl = (user: UserType) => `/Api/v1/public/authentication/${user}/login`;
export const refreshTokenUrl = (user: UserType) => `/Api/v1/public/authentication/${user}/refreshToken`;
export const logoutUrl = (user: UserType) => `/Api/v1/private/authentication/${user}/logOut`;

export const userPrivateUrl = (user: UserType) => `/Api/v1/private/${user}/`;
export const userPublicUrl = (user: UserType) => `/Api/v1/public/${user}/`;

export const ingredientPrivateUrl = () => `/Api/v1/private/ingredients/`;
export const ingredientPublicUrl = () => `/Api/v1/public/ingredients/`;

export const recipePrivateUrl = () => `/Api/v1/private/recipe/`;
export const recipePublicUrl = () => `/Api/v1/public/recipe/`;



export const newValidUser: IUserSignUpFrom = {
    email: "test@test.com",
    password: "abcd12345",
    first_name: "test",
    last_name: "last",
    phone_number: "+251900000",
    medical_condition: {
        allergies: [EAllergies.dairy],
        chronicDiseases: [EChronicDisease.diabetes, EChronicDisease.obesity],
        dietary_preferences: [EDietaryPreferences.vegan, EDietaryPreferences.LowSugar],
    }
};

export const newValidUser2: IUserSignUpFrom = {
    email: "test2@test.com",
    password: "abcd12345",
    first_name: "test2",
    last_name: "2",
    phone_number: "+251900000",
    medical_condition: {
        allergies: [EAllergies.none],
        chronicDiseases: [EChronicDisease.other],
        dietary_preferences: [EDietaryPreferences.other],
    }
};

export const ValidUser1Login: IUserLogInFrom = {
    email: "test@test.com",
    password: "abcd12345",
};

export const newValidModeratorSignUp: IModeratorSignUpFrom = {
    email: "test@admin.com",
    password: "abcd12345",
    phone_number: "+251900000",
    bio: "bio",
    first_name: "test",
    last_name: "last",
    profile_img: "profile_img",
}

export const newValidModeratorLogin: IModeratorLogInFrom = {
    email: "test@admin.com",
    password: "abcd12345",
}

export const validAdmin1Login: IModeratorLogInFrom = {
    email: "test@admin.com",
    password: "abcd12345",
}

export const validIngredients: INewIngredientFrom[] = [{
    localName: "አሰልጣኝ",
    name: "onion",
    type: "vegetable",
    unitOptions: ["kg", "g"]
}, {
    localName: "ባትር",
    name: "tomato",
    type: "vegetable",
    unitOptions: ["kg", "g"]
}, {
    localName: "በትር",
    name: "garlic",
    type: "vegetable",
    unitOptions: ["kg", "g"]
}];

export const expectError = async (response: Response, code: number) => {

    if (code == 400) {
        expect(response.status).toBe(code)
        expect(response.body.body).toBeUndefined();
        expect(response.body.error).toMatchObject({ msg: expect.any(String), type: "validation", attr: expect.any(String) });
    } else {
        expect(response.status).toBe(code)
        expect(response.body.body).toBeUndefined();
        expect(response.body.error).toMatchObject({ msg: expect.any(String) });
    }
}

export const createUsers = async (request: Function, app: any, newValidUsers: IUserSignUpFrom[]): Promise<{ users: IUser[], accessTokens: string[] }> => {

    const users: IUser[] = [];
    const accessTokens: string[] = [];

    for (let index = 0; index < newValidUsers.length; index++) {
        const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUsers[index]);
        users.push(response.body);
        accessTokens.push(response.header.authorization.split(" ")[1])
    }

    return { users, accessTokens }
}

export const createModerators = async (request: Function, app: any, newValidModeratorSignUp: IModeratorSignUpFrom[]): Promise<{ moderators: IModerator[], accessTokens: string[] }> => {

    const moderators: IModerator[] = [];
    const accessTokens: string[] = [];

    for (let index = 0; index < newValidModeratorSignUp.length; index++) {
        const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp[index]);
        moderators.push(response.body);
        accessTokens.push(response.header.authorization.split(" ")[1])
    }

    return { moderators, accessTokens }
}

export const createIngredients = async (request: Function, app: any, newValidIngredients: INewIngredientFrom[], accessToken: string): Promise<IIngredient[]> => {

    const ingredients: any[] = [];

    for (let index = 0; index < newValidIngredients.length; index++) {
        const response = await request(app).post(ingredientPrivateUrl()).set("authorization", `Bearer ${accessToken}`).send(newValidIngredients[index]);
        ingredients.push(response.body.body);
    }

    return ingredients;
}

export const createRecipes = async (request: Function, app: any, newValidRecipes: INewRecipeFrom[], accessToken: string): Promise<IRecipe[]> => {

    const recipes: any[] = [];

    for (let index = 0; index < newValidRecipes.length; index++) {
        const response = await request(app).post(recipePrivateUrl()).set("authorization", `Bearer ${accessToken}`).send(newValidRecipes[index]);
        recipes.push(response.body);
    }

    return recipes;
}

export const expectValidIngredient = (response: Response, input: INewIngredientFrom) => {
    expect(response.status).toBe(200);
    expect(response.body.body).toMatchObject({
        _id: expect.any(String),
        localName: input.localName,
        name: input.name,
        type: input.type,
        unitOptions: input.unitOptions,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        __v: expect.any(Number)
    });
}

export const expectValidListIngredient = async (response: Response, inputIngredients: INewIngredientFrom[], minLen: number, maxLen?: number, matchers?: Record<string, unknown> | Record<string, unknown>[]) => {

    expect(response.status).toBe(200)

    expect(response.body.body.length).toBeGreaterThanOrEqual(minLen)
    maxLen && expect(response.body.body.length).toBeLessThanOrEqual(maxLen)
    response.body.body.forEach((ingredient: IIngredient, index: number) => {
        expect(ingredient).toMatchObject(expect.objectContaining({
            _id: expect.any(String),
            localName: inputIngredients[index].localName,
            name: inputIngredients[index].name,
            type: inputIngredients[index].type,
            unitOptions: inputIngredients[index].unitOptions,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            ...matchers
        }));
    });
}