import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';
import { createIngredients, createModerators, createRecipes, createReviews, createUsers, expectError, expectValidMealPlanner, expectValidRecipeCardList, loginUrl, mealPlannerPrivateUrl, newValidModeratorSignUp, newValidUser, newValidUser2, sighupUrl, userPrivateUrl, userPublicUrl, validIngredients, validRecipes, validReviews, validUserStatus } from './common';
import { UserType } from '../src/Util/jwt/jwt.types';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';
import { IRecipe } from '../src/Schema/Recipe/recipe.type';

const redisCache = RedisCache.getInstance();


const app = makeServer();

describe('MealPlanner', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {
        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe('createMealPlan', () => {
        var user: IUser;
        var accessToken: string[];
        var ingredients: IIngredient[];
        var moderatorAccessTokens: string[];
        var recipes: IRecipe[];


        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser, newValidUser2]);
            user = users[0];
            accessToken = accessTokens;

            const { accessTokens: moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorAccessTokens = moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorAccessTokens[0]);
            ingredients = _ingredients;

            const _recipes = await createRecipes(request, app, validRecipes, ingredients, accessToken[0]);
            recipes = _recipes;
        });

        describe("WHEN user is logged in", () => {
            it("SHOULD create a meal plan", async () => {
                const res = await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                expectValidMealPlanner(res);
            });
        });
    });

    describe("Add to Meal Plan", () => {

        var user: IUser;
        var accessToken: string[];
        var ingredients: IIngredient[];
        var moderatorAccessTokens: string[];
        var recipes: IRecipe[];


        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser, newValidUser2]);
            user = users[0];
            accessToken = accessTokens;

            const { accessTokens: moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorAccessTokens = moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorAccessTokens[0]);
            ingredients = _ingredients;

            const _recipes = await createRecipes(request, app, validRecipes, ingredients, accessToken[0]);
            recipes = _recipes;
        });

        describe("WHEN user is logged in", () => {
            describe("WHEN user Dose't have a meal plan", () => {
                it("SHOULD return an error", async () => {
                    const res = await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);
                    expectError(res, 404);
                });
            });

            describe("WHEN user has a meal plan", () => {
                it("SHOULD add a recipe to the meal plan", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    const res = await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectValidMealPlanner(res, {
                        matchers: {
                            recipes: {
                                breakfast: {
                                    recipe: [recipes[0].id]
                                },
                                lunch: {
                                    recipe: []
                                },
                            }
                        }
                    });
                });
            });
        });
    });

    describe("Remove from Meal Plan", () => {

        var user: IUser;
        var accessToken: string[];
        var ingredients: IIngredient[];
        var moderatorAccessTokens: string[];
        var recipes: IRecipe[];

        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser, newValidUser2]);
            user = users[0];
            accessToken = accessTokens;

            const { accessTokens: moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorAccessTokens = moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorAccessTokens[0]);
            ingredients = _ingredients;

            const _recipes = await createRecipes(request, app, validRecipes, ingredients, accessToken[0]);
            recipes = _recipes;
        });

        describe("WHEN user is logged in", () => {
            describe("WHEN user Dose't have a meal plan", () => {
                it("SHOULD return an error", async () => {
                    const res = await request(app)
                        .post(`${mealPlannerPrivateUrl()}removeFromMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);
                    console.log(res.body);
                    expectError(res, 404);
                });
            });

            describe("WHEN user has a meal plan", () => {
                it("SHOULD remove a recipe from the meal plan", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    var res = await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectValidMealPlanner(res, {
                        matchers: {
                            recipes: {
                                breakfast: {
                                    recipe: [recipes[0].id]
                                },
                            }
                        }
                    });


                    res = await request(app)
                        .delete(`${mealPlannerPrivateUrl()}removeFromMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectValidMealPlanner(res, {
                        matchers: {
                            recipes: {
                                breakfast: {
                                    recipe: []
                                },
                            }
                        }
                    });
                    expect(res.status).toBe(200);

                });
            });
        });
    })
});