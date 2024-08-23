import { Response } from "supertest";
import { expect } from '@jest/globals';
import { UserType } from "../src/Util/jwt/jwt.types";
import { EAllergies, EChronicDisease, EDietaryPreferences, IUser, IUserLogInFrom, IUserSignUpFrom } from "../src/Schema/user/user.type";
import { IModeratorLogInFrom, IModeratorSignUpFrom } from "../src/Schema/Moderator/moderator.type";


export const sighupUrl = (user: UserType) => `/Api/v1/public/authentication/${user}/signUp`;
export const privateSighupUrl = (user: UserType = UserType.admin) => `/Api/v1/private/authentication/${user}/signUp`;
export const loginUrl = (user: UserType) => `/Api/v1/public/authentication/${user}/login`;
export const refreshTokenUrl = (user: UserType) => `/Api/v1/public/authentication/${user}/refreshToken`;
export const logoutUrl = (user: UserType) => `/Api/v1/private/authentication/${user}/logOut`;

export const userPrivateUrl = (user: UserType) => `/Api/v1/private/${user}/`;
export const userPublicUrl = (user: UserType) => `/Api/v1/public/${user}/`;

export const productPrivateUrl = () => `/Api/v1/private/product/`;
export const productPublicUrl = () => `/Api/v1/public/product/`;



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
}

export const validAdmin1Login: IModeratorLogInFrom = {
    email: "test@admin.com",
    password: "abcd12345",
}

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

export const createUser = async (request: Function, app: any, newValidUsers: IUserSignUpFrom[]): Promise<{ users: IUser[], accessTokens: string[] }> => {

    const users: IUser[] = [];
    const accessTokens: string[] = [];

    for (let index = 0; index < newValidUsers.length; index++) {
        const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUsers[index]);
        users.push(response.body);
        accessTokens.push(response.header.authorization.split(" ")[1])
    }

    return { users, accessTokens }
}

export const expectValidProduct = async (product: any) => {
    expect(product).toMatchObject({
        _id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        amount: expect.any(Number),
        brand: expect.any(String),
        itemModel: expect.any(String),
        images: expect.any(Array),
        condition: expect.any(String),
        deliveryMethod: expect.any(String),
        categorys: expect.any(Array),
        types: expect.any(Array),
        for: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
    });
}