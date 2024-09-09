import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';
import {
    createModerators, createUsers, expectError, newValidModeratorSignUp, newValidUser2, reviewPrivateUrl,
    createIngredients, validIngredients, userPublicUrl, reviewPublicUrl,
    createRecipes,
    validRecipes,
    validReview,
    expectValidReview,
} from './common';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';
import { UserType } from '../src/Util/jwt/jwt.types';
import { IRecipe } from '../src/Schema/Recipe/recipe.type';
import { INewReviewFrom } from '../src/Schema/Review/review.type';

const redisCache = RedisCache.getInstance();

const app = makeServer();


describe('Review', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {

        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe("Creating Review", () => {
        describe("WHEN Login in as a User", () => {

            var user: IUser;
            var accessToken: string;
            var moderatorTokens: string[];
            var recipes: IRecipe[];

            beforeEach(async () => {
                const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
                user = users[0];
                accessToken = accessTokens[0];

                const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
                moderatorTokens = _moderatorTokens;

                const _ingredients = await createIngredients(request, app, validIngredients, moderatorTokens[0]);

                const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
                recipes = _recipes;

            })

            describe("WHEN the Review is Invalid", () => {
                it("SHOULD return a 400 status code AND Error obj", async () => {
                    const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({});
                    expectError(response, 400);
                });

            });

            describe("WHEN the Review is Valid", () => {

                it("SHOULD return a 200 status code AND Review obj", async () => {
                    const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                        ...validReview,
                        recipe: recipes[0]._id,
                    } as INewReviewFrom);

                    expectValidReview(response, ({
                        ...validReview,
                        recipe: recipes[0]._id,
                    } as INewReviewFrom));

                });

                describe("WHEN the Review is Created", () => {

                    it("SHOULD update Reviews User field", async () => {
                        const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                            ...validReview,
                            recipe: recipes[0]._id,
                        } as INewReviewFrom);

                        const recipeResponse = await request(app).get(`${reviewPublicUrl()}/${response.body.body._id}`).send();
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

    describe("Get Review", () => {

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

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
            recipes = _recipes;

        })

        describe("WHEN trying to get Review by Pagination {skip}/{limit}", () => {

            describe("WHEN trying to get review using recipeId", () => {

                it("SHOULD return 200 with Review[] obj with all having pending status ", async () => {
                    const response = await request(app).get(`${reviewPrivateUrl()}recipe/${recipes[0]._id}/:skip/: limit`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                    // expectValidReviewCardList(response, 1, 3, {
                    //     status: EReviewStatus.pending
                    // });
                })


                describe("WHEN trying to get [moderator protected] Review As a User", () => {
                    it("SHOULD return 401 with error obj", async () => {
                        const response = await request(app).get(`${reviewPrivateUrl()}moderator / list / 0 / 1 / all`).set("authorization", `Bearer ${accessToken}`).send();
                        expectError(response, 401);
                    })
                })
            })

        });

        describe("WHEN trying to get Review by Ingredient id", () => {

            describe("WHEN trying to get Review by valid Ingredient id", () => {

                describe("WHEN trying to get [moderator protected]", () => {

                    describe("WHEN trying to get [moderator protected] Review As a Moderator", () => {

                        it("SHOULD return 200 with Review obj With an isModeratedReview attribute", async () => {
                            const response = await request(app).get(`${reviewPrivateUrl()}details / moderator / ${recipes[0]._id}`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                            // expectValidReview(response, ({
                            //     ...validReviews[0],
                            //     ingredients: ingredients.map(ingredient => ({
                            //         amount: 1,
                            //         unit: "kg",
                            //         localName: ingredient.localName,
                            //         name: ingredient.name,
                            //         type: ingredient.type,
                            //     }))
                            // } as INewReviewFrom), {
                            //     isModeratedReview: false
                            // });
                        })
                    })

                    describe("WHEN trying to get [moderator protected] Review As a User", () => {
                        it("SHOULD return 401 with error obj", async () => {
                            const response = await request(app).get(`${reviewPrivateUrl()}details / moderator / ${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                            expectError(response, 401);
                        })
                    })
                })

                describe("WHEN trying to get [user protected]", () => {

                    describe("WHEN trying to get [user protected] Review As a User", () => {

                        it("SHOULD return 200 with Review obj With an isModeratedReview attribute", async () => {
                            const response = await request(app).get(`${reviewPrivateUrl()}details / user / ${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                            expectValidReview(response, ({
                                ...validReviews[0],
                                ingredients: ingredients.map(ingredient => ({
                                    amount: 1,
                                    unit: "kg",
                                    localName: ingredient.localName,
                                    name: ingredient.name,
                                    type: ingredient.type,
                                }))
                            } as INewReviewFrom), {
                                hasBookedReview: false,
                                ownsReview: true
                            });
                        })
                    })

                    describe("WHEN trying to get [user protected] Review As a Moderator", () => {
                        it("SHOULD return 401 with error obj", async () => {
                            const response = await request(app).get(`${reviewPrivateUrl()}details / user / ${recipes[0]._id}`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                            expectError(response, 401);
                        })
                    })
                })


                describe("WHEN trying to get Review by InValid Ingredient id", () => {
                    it("SHOULD return 404 with error obj", async () => {
                        const response = await request(app).get(`${reviewPublicUrl()}75cfba229d3e6fb530a1d4d5`).send();
                        expectError(response, 404);
                    });
                })
            })

        });

    });


});