import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';
import { createIngredients, createModerators, createRecipes, createReviews, createUsers, defaultNutritionData, defaultNutritionGoal, expectError, expectValidMealPlanner, expectValidRecipeCardLisMealplanners, expectValidRecipeCardList, expectValidRecipeCardListWithNoRes, loginUrl, mealPlannerPrivateUrl, newValidModeratorSignUp, newValidUser, newValidUser2, sighupUrl, userPrivateUrl, userPublicUrl, validIngredients, validRecipes, validReviews, validUserStatus } from './common';
import { UserType } from '../src/Util/jwt/jwt.types';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';
import { ERecipeStatus, IRecipe } from '../src/Schema/Recipe/recipe.type';
import { EActivityLevel, EDietGoals, EGender, IMealPlanner, INewMealPlanner } from '../src/Schema/user/MealPlanner/mealPlanner.type';

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

        describe("WHEN user have a meal plan", () => {
            it("SHOULD return an 400 error", async () => {
                await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                const res = await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);
                expectError(res, 400);
            });
        })
        describe("WHEN User dose't have a meal plan", () => {
            it("SHOULD create a meal plan", async () => {
                const res = await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                expectValidMealPlanner(res);
            });
        })

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
                        recipes: [
                            {
                                recipe: recipes[0].id,
                                mealTime: "breakfast"
                            }
                        ]
                    }
                });
            });

            describe("WHEN user added a duplicate recipe", () => {
                it("SHOULD return an error", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    const res = await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectError(res, 400);
                });
            })
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

        describe("WHEN user Dose't have a meal plan", () => {
            it("SHOULD return an error", async () => {
                const res = await request(app)
                    .delete(`${mealPlannerPrivateUrl()}removeFromMealPlan/${recipes[0].id}`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);
                console.log(res.body);
                expectError(res, 404);
            });
        });

        describe("WHEN user has a meal plan", () => {

            describe("WHEN user try to remove a recipe that dose't exist", () => {
                it("SHOULD return an error", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    const res = await request(app)
                        .delete(`${mealPlannerPrivateUrl()}removeFromMealPlan/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectError(res, 400);
                });
            });

            describe("WHEN user try to remove a recipe that exist", () => {
                it("SHOULD remove a recipe from the meal plan and Subtract the recipe's nutrients from current in from total nutrients", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    var res = await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectValidMealPlanner(res, {
                        matchers: {
                            recipes: [
                                {
                                    recipe: recipes[0].id,
                                    mealTime: "breakfast"
                                }
                            ]
                        }
                    });


                    res = await request(app)
                        .delete(`${mealPlannerPrivateUrl()}removeFromMealPlan/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expectValidMealPlanner(res, {
                        matchers: {
                            currentNutrition: defaultNutritionGoal,
                            recipes: [],
                            nutrition: defaultNutritionData
                        }
                    });
                    expect(res.status).toBe(200);

                });
            });
        });
    });

    describe("Reset Meal Plan Recipes", () => {

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
        describe("WHEN user Dose't have a meal plan", () => {
            it("SHOULD return an error", async () => {
                const res = await request(app)
                    .delete(`${mealPlannerPrivateUrl()}reset/recipes`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);
                expectError(res, 404);
            });
        });

        describe("WHEN user has a meal plan", () => {
            it("SHOULD reset the meal plan and reset user total nutrients", async () => {
                await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                var res = await request(app)
                    .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);

                expectValidMealPlanner(res, {
                    matchers: {
                        recipes: [
                            {
                                recipe: recipes[0].id,
                                mealTime: "breakfast"
                            }
                        ]
                    }
                });

                res = await request(app)
                    .delete(`${mealPlannerPrivateUrl()}reset/recipes`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);


                expectValidMealPlanner(res, {
                    matchers: {
                        recipes: [],
                        nutrition: defaultNutritionData
                    }
                });
                expect(res.status).toBe(200);
            });
        });
    });

    describe("Get mealPlan Recipes", () => {
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

        describe("WHEN user Dose't have a meal plan", () => {
            it("SHOULD return an error", async () => {
                const res = await request(app)
                    .get(`${mealPlannerPrivateUrl()}mealPlan/breakfast/1`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);

                expectError(res, 404);
            });
        });

        describe("WHEN user has a meal plan", () => {
            it("SHOULD return the meal plan", async () => {
                await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                await request(app).patch(`${userPrivateUrl(UserType.moderator)}updateRecipeStatus/${recipes[0]._id}`).set('authorization', `Bearer ${moderatorAccessTokens[0]}`).send({
                    status: ERecipeStatus.verified,
                    comment: "this is a comment"
                });

                await request(app)
                    .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);

                var res = await request(app)
                    .get(`${mealPlannerPrivateUrl()}mealPlan/breakfast/1`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);

                console.log({ body: res.body.body })
                expectValidRecipeCardLisMealplanners(res, 1);
            });

            it("SHOULD return the meal plan", async () => {
                await request(app)
                    .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                var res = await request(app)
                    .get(`${mealPlannerPrivateUrl()}mealPlan/breakfast/1`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);

                expectValidRecipeCardLisMealplanners(res, 0);

            });
        });
    });

    describe("update Stats", () => {
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

        describe("WHEN user Dose't have a meal plan", () => {
            it("SHOULD return an error", async () => {
                const res = await request(app)
                    .patch(`${mealPlannerPrivateUrl()}updateStats`)
                    .set('Authorization', 'Bearer ' + accessToken[0])
                    .send(validUserStatus[0]);

                expectError(res, 404);
            });
        });

        describe("WHEN user has a meal plan", () => {

            describe("WHEN user update the stats with invalid data", () => {
                it("SHOULD return an error", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    var res = await request(app)
                        .patch(`${mealPlannerPrivateUrl()}updateStats`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send({
                            weight: "80",
                            as: "as"
                        });

                    expectError(res, 400);
                });
            });

            describe("WHEN user update the stats with valid data", () => {
                it("SHOULD update the user stats", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    var res = await request(app)
                        .patch(`${mealPlannerPrivateUrl()}updateStats`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send({
                            weight: 80,
                            height: 180,
                            age: 25,
                            activityLevel: EActivityLevel.active,
                            diet_goals: EDietGoals.weight_loss,
                            gender: EGender.female
                        } as INewMealPlanner);

                    console.log(res.body.body.userStats);

                    expectValidMealPlanner(res, {
                        matchers: {
                            userStats: {
                                weights: expect.any(Array),
                                weight: 80,
                                height: 180,
                                age: 25,
                                activityLevel: EActivityLevel.active,
                                diet_goals: EDietGoals.weight_loss,
                            }
                        }
                    });
                });
            });
        });
    });

    describe("shoppingList", () => {
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

        describe("WHEN user Dose't have a meal plan", () => {
            it("SHOULD return an error", async () => {
                const res = await request(app)
                    .get(`${mealPlannerPrivateUrl()}shoppingList/breakfast`)
                    .set('Authorization', 'Bearer ' + accessToken[0]);

                expectError(res, 404);
            });
        });

        describe("WHEN user has a meal plan and add recipes", () => {

            describe("WHEN adding a recipe", () => {
                it("SHOULD return the shopping list with Contains the ingredients of all recipes added", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    var res = await request(app)
                        .get(`${mealPlannerPrivateUrl()}shoppingList/breakfast`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    expect(res.body.body).toEqual(recipes[0].ingredients)
                });
                describe("WHEN user added duplicate ingredients", () => {
                    it("SHOULD return the shopping list with Contains the ingredients of all recipes added WITH No duplicate", async () => {
                        await request(app)
                            .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                            .set('Authorization', 'Bearer ' + accessToken[0])
                            .send(validUserStatus[0]);

                        await request(app)
                            .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                            .set('Authorization', 'Bearer ' + accessToken[0]);

                        await request(app)
                            .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[1].id}`)
                            .set('Authorization', 'Bearer ' + accessToken[0]);

                        var res = await request(app)
                            .get(`${mealPlannerPrivateUrl()}shoppingList/breakfast`)
                            .set('Authorization', 'Bearer ' + accessToken[0]);

                        expect(res.body.body).toEqual(
                            recipes[0].ingredients.map((ingredient, index) => {
                                if (recipes[1].ingredients[index].name === ingredient.name) {
                                    return { ...ingredient, amount: ingredient.amount + recipes[1].ingredients[index].amount };
                                }
                            })
                        )
                    });
                })
            });

            describe("WHEN removing a recipe", () => {
                it("SHOULD return the shopping list Containing the ingredients of all recipes added except the removed one", async () => {
                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}createMealPlan`)
                        .set('Authorization', 'Bearer ' + accessToken[0])
                        .send(validUserStatus[0]);

                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    await request(app)
                        .post(`${mealPlannerPrivateUrl()}addToMealPlan/breakfast/${recipes[1].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    await request(app)
                        .delete(`${mealPlannerPrivateUrl()}removeFromMealPlan/${recipes[0].id}`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    var res = await request(app)
                        .get(`${mealPlannerPrivateUrl()}shoppingList/breakfast`)
                        .set('Authorization', 'Bearer ' + accessToken[0]);

                    console.log({ res: res.body.body })

                    expect(res.body.body).toEqual(recipes[1].ingredients)
                });
            });


        });
    });
});