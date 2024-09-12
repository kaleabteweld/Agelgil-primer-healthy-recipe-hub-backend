import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';

import { createIngredients, createRecipes, createModerators, expectError, expectValidRecipeCardList, loginUrl, newValidModeratorSignUp, sighupUrl, userPrivateUrl, userPublicUrl, validIngredients, validRecipes, newValidUser, createUsers } from './common';
import { UserType } from '../src/Util/jwt/jwt.types';
import { ERecipeStatus, IRecipe } from '../src/Schema/Recipe/recipe.type';
import { IModerator } from '../src/Schema/Moderator/moderator.type';
import { IUser } from '../src/Schema/user/user.type';

const redisCache = RedisCache.getInstance();

const app = makeServer();

describe('Moderator', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {
        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe("Get", () => {

        var users: IModerator[] = [];
        var accessTokens: string[];

        beforeEach(async () => {
            const { accessTokens: ats, moderators: usrs } = await createModerators(request, app, [newValidModeratorSignUp]);
            accessTokens = ats;
            users = usrs

        })

        describe("WHEN trying to get Moderator by there ID in JWT", () => {

            describe("WHEN trying to get Moderator by valid Moderator id", () => {

                it("SHOULD return the Moderator with that id", async () => {

                    const userResponse = await request(app).get(userPrivateUrl(UserType.moderator)).set("authorization", `Bearer ${accessTokens[0]}`).send();
                    expect(userResponse.status).toBe(200);

                    const checkValidModerator = { ...newValidModeratorSignUp }
                    delete (checkValidModerator as any)["password"]
                    expect(userResponse.body.body).toMatchObject({ ...checkValidModerator });
                })
            })

            describe("WHEN trying to get Moderator by InValid organizer id", () => {

                it("SHOULD return 401 with error obj", async () => {
                    const userResponse = await request(app).get(userPrivateUrl(UserType.moderator)).send();
                    expectError(userResponse, 401);
                });

                describe("WHEN trying to get Moderator by InValid JWT", () => {
                    it("SHOULD return 401 with error obj", async () => {

                        const invalidKWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                        const userResponse = await request(app).get(userPrivateUrl(UserType.moderator)).set("authorization", `Bearer ${invalidKWT}`).send();
                        expectError(userResponse, 401);

                    })
                })
            })
        })

    });

    describe("Update", () => {

        var users: IModerator[] = [];
        var accessTokens: string[];

        beforeEach(async () => {
            const { accessTokens: ats, moderators: usrs } = await createModerators(request, app, [newValidModeratorSignUp]);
            accessTokens = ats;
            users = usrs

        })

        describe("WHEN Login in as a Moderator", () => {

            describe("WHEN user try to update there info", () => {

                it("SHOULD update only one Attributes Not the rest and return 200", async () => {
                    let response = await request(app).patch(`${userPrivateUrl(UserType.moderator)}update`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                        name: "kolo"
                    });
                    const userResponse = await request(app).get(userPrivateUrl(UserType.moderator)).set("authorization", `Bearer ${accessTokens[0]}`).send();
                    const checkValidModerator = { ...newValidModeratorSignUp }
                    delete (checkValidModerator as any)["password"];

                    expect(userResponse.body.body).toMatchObject({ ...checkValidModerator });
                });

                describe("WHEN user try to update there Password", () => {

                    it("SHOULD update password and Not Login with old password", async () => {
                        let response = await request(app).patch(`${userPrivateUrl(UserType.moderator)}update`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                            password: "password123321"
                        });
                        const userResponse = await request(app).post(loginUrl(UserType.moderator)).set("authorization", `Bearer ${accessTokens[0]}`).send({
                            email: users[0].email,
                            password: users[0].password
                        });

                        expectError(userResponse, 400)

                    });

                    it("SHOULD update password and only Login with new password", async () => {
                        await request(app).patch(`${userPrivateUrl(UserType.moderator)}update`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                            password: "password123321"
                        });
                        const userResponse = await request(app).post(loginUrl(UserType.moderator)).send({
                            email: users[0].email,
                            password: "password123321"
                        });
                        console.log({ userResponse: userResponse.body })

                        expect(userResponse.status).toBe(200)

                    });

                });

            });

        });

        describe("WHEN not Login in as a User", () => {

            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).patch(`${userPrivateUrl(UserType.moderator)}update`).send({});
                expectError(response, 401);
            });

            describe("WHEN Login in as a Moderator", () => {

                var user: IModerator;
                var organizerAccessToken: string;

                beforeEach(async () => {
                    const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
                    user = response.body;
                    organizerAccessToken = response.header.authorization.split(" ")[1];
                })

                it("SHOULD return a 401 status code AND Error obj", async () => {
                    const response = await request(app).patch(`${userPrivateUrl(UserType.moderator)}update`).set('authorization', `Bearer ${organizerAccessToken}`).send({});
                    expectError(response, 401);
                })
            })

        });

    })

    describe("Update Recipe Status", () => {

        var user: IUser;
        var accessToken: string;
        var moderatorTokens: string[];
        var recipes: IRecipe[];

        beforeEach(async () => {

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorTokens = _moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorTokens[0]);

            const { accessTokens: userAccessTokens } = await createUsers(request, app, [newValidUser]);
            accessToken = userAccessTokens[0];

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
            recipes = _recipes;
        })

        describe("WHEN Login in as a Moderator", () => {

            describe("WHEN user try to update Recipe Status", () => {

                it("SHOULD update recipe status and return verified Recipe", async () => {
                    await request(app).patch(`${userPrivateUrl(UserType.moderator)}updateRecipeStatus/${recipes[0]._id}`).set('authorization', `Bearer ${moderatorTokens[0]}`).send({
                        status: ERecipeStatus.verified,
                        comment: "this is a comment"
                    });

                    const recipeResponse = await request(app).get(`${userPrivateUrl(UserType.moderator)}moderatedRecipes/${ERecipeStatus.verified}/0/10`).set('authorization', `Bearer ${moderatorTokens[0]}`).send();
                    console.log({ recipeResponse: recipeResponse.body.body })
                    expect(recipeResponse.body.body.length).toBe(1);

                    expectValidRecipeCardList(recipeResponse, 1);
                });

            });

        });

        describe("WHEN not Login in as a User", () => {

            it("SHOULD Not update recipe status and return verified Recipe", async () => {
                const response = await request(app).patch(`${userPrivateUrl(UserType.moderator)}updateRecipeStatus/${recipes[0]._id}`).set('authorization', `Bearer ${accessToken}`).send({
                    status: ERecipeStatus.verified,
                    comment: "this is a comment"
                });
                expectError(response, 401);

            });

        });

    });
});