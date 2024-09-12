import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';
import {
    createRecipes, createModerators, createUsers, expectError, newValidModeratorSignUp, newValidUser2, validRecipes, recipePrivateUrl, expectValidRecipe,
    createIngredients, validIngredients, userPublicUrl, recipePublicUrl, expectValidRecipeList, expectValidRecipeCardList,
    newValidUser,
    userPrivateUrl
} from './common';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';
import { EPreferredMealTime, ERecipeStatus, INewRecipeFrom, IRecipe } from '../src/Schema/Recipe/recipe.type';
import { UserType } from '../src/Util/jwt/jwt.types';

const redisCache = RedisCache.getInstance();

const app = makeServer();


describe('Recipe', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {

        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe("Creating Recipe", () => {
        describe("WHEN Login in as a User", () => {

            var user: IUser;
            var accessToken: string;
            var moderatorTokens: string[];
            var ingredients: IIngredient[];

            beforeEach(async () => {
                const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
                user = users[0];
                accessToken = accessTokens[0];

                const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
                moderatorTokens = _moderatorTokens;

                const _ingredients = await createIngredients(request, app, validIngredients, moderatorTokens[0]);
                ingredients = _ingredients;
            })

            describe("WHEN the Recipe is Invalid", () => {
                it("SHOULD return a 400 status code AND Error obj", async () => {
                    const response = await request(app).post(`${recipePrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({});
                    expectError(response, 400);
                });

            });

            describe("WHEN the Recipe is Valid", () => {

                it("SHOULD return a 200 status code AND Recipe obj", async () => {
                    const response = await request(app).post(`${recipePrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                        ...validRecipes[0],
                        ingredients: ingredients.map(ingredient => ({ ingredient: ingredient._id, amount: 1, unit: "kg" }))
                    } as INewRecipeFrom);

                    expectValidRecipe(response, ({
                        ...validRecipes[0],
                        ingredients: ingredients.map(ingredient => ({
                            amount: 1,
                            unit: "kg",
                            localName: ingredient.localName,
                            name: ingredient.name,
                            type: ingredient.type,
                        }))
                    } as INewRecipeFrom));

                });

                describe("WHEN the Recipe is Created", () => {
                    it("SHOULD Update the User Recipe List", async () => {
                        const response = await request(app).post(`${recipePrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                            ...validRecipes[0],
                            ingredients: ingredients.map(ingredient => ({ ingredient: ingredient._id, amount: 1, unit: "kg" }))
                        } as INewRecipeFrom);

                        const userResponse = await request(app).get(`${userPublicUrl(UserType.user)}id/${user._id}`).send();
                        expect(userResponse.body.body.my_recipes).toHaveLength(1);
                        expect(userResponse.body.body.my_recipes[0]).toEqual(response.body.body._id);
                    });

                    it("SHOULD update Recipes User field", async () => {
                        const response = await request(app).post(`${recipePrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                            ...validRecipes[0],
                            ingredients: ingredients.map(ingredient => ({ ingredient: ingredient._id, amount: 1, unit: "kg" }))
                        } as INewRecipeFrom);

                        const recipeResponse = await request(app).get(`${recipePublicUrl()}/${response.body.body._id}`).send();
                        expect(recipeResponse.body.body.user).toEqual({
                            user: user._id,
                            full_name: user.full_name,
                            profile_img: user.profile_img
                        });
                    });
                });

            });

        });
    });

    describe("Get Recipe", () => {

        var user: IUser;
        var accessToken: string;
        var moderatorTokens: string[];
        var ingredients: IIngredient[];
        var recipes: IRecipe[];

        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
            user = users[0];
            accessToken = accessTokens[0];

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorTokens = _moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorTokens[0]);
            ingredients = _ingredients;

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
            recipes = _recipes;
        })

        describe("WHEN trying to get Recipe by Pagination {skip}/{limit}", () => {

            describe("WHEN trying to get [moderator protected]", () => {

                describe("WHEN trying to get [moderator protected] Recipe[] As a Moderator", () => {

                    it("SHOULD return 200 with Recipe[] obj with all having pending status ", async () => {
                        const response = await request(app).get(`${recipePrivateUrl()}moderator/list/0/1/all`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                        expectValidRecipeCardList(response, 1, 3, {
                            status: ERecipeStatus.pending
                        });
                    })
                })

                describe("WHEN trying to get [moderator protected] Recipe As a User", () => {
                    it("SHOULD return 401 with error obj", async () => {
                        const response = await request(app).get(`${recipePrivateUrl()}moderator/list/0/1/all`).set("authorization", `Bearer ${accessToken}`).send();
                        expectError(response, 401);
                    })
                })
            })

            describe("WHEN trying to get Recipe[] with " + EPreferredMealTime.breakfast.toString, () => {
                it("SHOULD return 200 with Recipe[] obj with all having preferredMealTime: " + EPreferredMealTime.breakfast.toString, async () => {
                    const response = await request(app).get(`${recipePublicUrl()}list/${EPreferredMealTime.breakfast}/0/3`).set("authorization", `Bearer ${accessToken}`).send();
                    expectValidRecipeCardList(response, 1, 3, {
                        preferredMealTime: expect.arrayContaining([EPreferredMealTime.breakfast])
                    });
                })

            })

        });

        describe("WHEN trying to get Recipe by Ingredient id", () => {

            describe("WHEN trying to get Recipe by valid Ingredient id", () => {

                describe("WHEN trying to get [moderator protected]", () => {

                    describe("WHEN trying to get [moderator protected] Recipe As a Moderator", () => {

                        it("SHOULD return 200 with Recipe obj With an isModeratedRecipe attribute", async () => {
                            const response = await request(app).get(`${recipePrivateUrl()}details/moderator/${recipes[0]._id}`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                            expectValidRecipe(response, ({
                                ...validRecipes[0],
                                ingredients: ingredients.map(ingredient => ({
                                    amount: 1,
                                    unit: "kg",
                                    localName: ingredient.localName,
                                    name: ingredient.name,
                                    type: ingredient.type,
                                }))
                            } as INewRecipeFrom), {
                                isModeratedRecipe: false
                            });
                        })
                    })

                    describe("WHEN trying to get [moderator protected] Recipe As a User", () => {
                        it("SHOULD return 401 with error obj", async () => {
                            const response = await request(app).get(`${recipePrivateUrl()}details/moderator/${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                            expectError(response, 401);
                        })
                    })
                })

                describe("WHEN trying to get [user protected]", () => {

                    describe("WHEN trying to get [user protected] Recipe As a User", () => {

                        it("SHOULD return 200 with Recipe obj With an isModeratedRecipe attribute", async () => {
                            const response = await request(app).get(`${recipePrivateUrl()}details/User/${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                            expectValidRecipe(response, ({
                                ...validRecipes[0],
                                ingredients: ingredients.map(ingredient => ({
                                    amount: 1,
                                    unit: "kg",
                                    localName: ingredient.localName,
                                    name: ingredient.name,
                                    type: ingredient.type,
                                }))
                            } as INewRecipeFrom), {
                                hasBookedRecipe: false,
                                ownsRecipe: true
                            });
                        })
                    })

                    describe("WHEN trying to get [user protected] Recipe As a Moderator", () => {
                        it("SHOULD return 401 with error obj", async () => {
                            const response = await request(app).get(`${recipePrivateUrl()}details/user/${recipes[0]._id}`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                            expectError(response, 401);
                        })
                    })
                })


                describe("WHEN trying to get Recipe by InValid Ingredient id", () => {
                    it("SHOULD return 404 with error obj", async () => {
                        const response = await request(app).get(`${recipePublicUrl()}75cfba229d3e6fb530a1d4d5`).send();
                        expectError(response, 404);
                    });
                })
            })

        });

    });

    describe("Update Recipe", () => {

        var accessTokens: string[];
        var moderatorAccessTokens: string[];
        var ingredients: IIngredient[];
        var recipes: IRecipe[];

        beforeEach(async () => {
            const { users, accessTokens: ats } = await createUsers(request, app, [newValidUser, newValidUser2]);
            accessTokens = ats;

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorAccessTokens = _moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorAccessTokens[0]);
            ingredients = _ingredients;

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessTokens[0]);
            recipes = _recipes;
        })

        describe("WHEN Login in as a User", () => {
            describe("WHEN User try to update Recipe", () => {
                it("SHOULD update and return 200 with the Recipe", async () => {
                    let response = await request(app).patch(`${recipePrivateUrl()}update/${recipes[0]._id}`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                        name: "New Name"
                    });
                    expect(response.status).toBe(200);

                    const getResponse = await request(app).get(`${recipePrivateUrl()}details/user/${recipes[0]._id}`).set("authorization", `Bearer ${accessTokens[0]}`).send();
                    expectValidRecipe(getResponse, ({
                        ...validRecipes[0],
                        name: "New Name",
                        ingredients: ingredients.map(ingredient => ({
                            amount: 1,
                            unit: "kg",
                            localName: ingredient.localName,
                            name: ingredient.name,
                            type: ingredient.type,
                        }))
                    } as INewRecipeFrom), {
                        hasBookedRecipe: false,
                        ownsRecipe: true
                    });
                });

            });

            describe("WHEN user Updates a Recipe that does not belong to them", () => {
                it("SHOULD return a 403 status code AND Error obj", async () => {
                    const response = await request(app).patch(`${recipePrivateUrl()}update/${recipes[0]._id}`).set('authorization', `Bearer ${accessTokens[1]}`).send({
                        name: "New Name"
                    });
                    expectError(response, 403);
                });
            })

            describe("WHEN user Updates a Recipe that that is Moderated", () => {
                it(`SHOULD reset the status to ${ERecipeStatus.pending}`, async () => {

                    await request(app).patch(`${userPrivateUrl(UserType.moderator)}updateRecipeStatus/${recipes[0]._id}`).set('authorization', `Bearer ${moderatorAccessTokens[0]}`).send({
                        status: ERecipeStatus.verified,
                        comment: "this is a comment"
                    });

                    const response = await request(app).patch(`${recipePrivateUrl()}update/${recipes[0]._id}`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                        name: "New Name"
                    });
                    expect(response.status).toBe(200);

                    const getResponse = await request(app).get(`${recipePrivateUrl()}details/user/${recipes[0]._id}`).set("authorization", `Bearer ${accessTokens[0]}`).send();
                    expectValidRecipe(getResponse, ({
                        ...validRecipes[0],
                        name: "New Name",
                        ingredients: ingredients.map(ingredient => ({
                            amount: 1,
                            unit: "kg",
                            localName: ingredient.localName,
                            name: ingredient.name,
                            type: ingredient.type,
                        }))
                    } as INewRecipeFrom), {
                        status: ERecipeStatus.pending,
                    });
                });
            })
        });

        describe("WHEN there is not a Token", () => {
            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).patch(`${recipePrivateUrl()}update/${recipes[0]._id}`).send({
                    name: "New Name"
                });
                expectError(response, 401);
            });

            describe("WHEN Login in as a Moderator", () => {
                it("SHOULD return a 401 status code AND Error obj", async () => {
                    const response = await request(app).patch(`${recipePrivateUrl()}update/${recipes[0]._id}`).set('authorization', `Bearer ${moderatorAccessTokens[0]}`).send({
                        name: "New Name"
                    });
                    expectError(response, 401);
                })
            })

        });

    })

});