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
    expectValidReview,
    recipePublicUrl,
    createReviews,
    validReviews,
    expectValidReviewList,
} from './common';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';
import { IRecipe } from '../src/Schema/Recipe/recipe.type';
import { INewReviewFrom, IReview } from '../src/Schema/Review/review.type';
import { IModerator } from '../src/Schema/Moderator/moderator.type';

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

                describe("WHEN recipe is not provided", () => {
                    it("SHOULD return a 404 status code AND Error obj", async () => {
                        const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({});
                        expectError(response, 404);
                    });
                });

                describe("WHEN rating is provided", () => {
                    it("SHOULD return a 404 status code AND Error obj", async () => {
                        const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                            recipe: recipes[0]._id,
                        });
                        expectError(response, 400);
                    });
                });

            });

            describe("WHEN the Review is Valid", () => {

                it("SHOULD return a 200 status code AND Review obj", async () => {
                    const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                        ...validReviews[0],
                        recipe: recipes[0]._id,
                    } as INewReviewFrom);

                    expectValidReview(response, ({
                        ...validReviews[0],
                        recipe: recipes[0]._id,
                    } as INewReviewFrom));

                });

                describe("WHEN the User has already reviewed the Recipe", () => {

                    it("SHOULD return a 400 status code AND Error obj", async () => {
                        await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                            ...validReviews[0],
                            recipe: recipes[0]._id,
                        } as INewReviewFrom);

                        const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                            ...validReviews[0],
                            recipe: recipes[0]._id,
                        } as INewReviewFrom);
                        expectError(response, 400);
                    });
                });
            });
            describe("WHEN the Review is Created", () => {

                it("SHOULD update Reviews User field", async () => {
                    const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                        ...validReviews[0],
                        recipe: recipes[0]._id,
                    } as INewReviewFrom);

                    const recipeResponse = await request(app).get(`${reviewPublicUrl()}/${response.body.body._id}`).send();
                    expect(recipeResponse.body.body.user).toEqual({
                        user: user._id,
                        full_name: user.full_name,
                        profile_img: user.profile_img
                    });
                });

                it("SHOULD update Recipe Average Rating", async () => {
                    const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${accessToken}`).send({
                        ...validReviews[0],
                        recipe: recipes[0]._id,
                    } as INewReviewFrom);

                    const recipeResponse = await request(app).get(`${recipePublicUrl()}/${recipes[0]._id}`).send();
                    expect(recipeResponse.body.body.rating).toBe(
                        (validReviews[0].rating + validReviews[0].rating) / 2
                    )
                });
            });

        });

        describe("WHEN Login in as a Moderator", () => {

            var moderator: IModerator;
            var accessToken: string;
            var moderatorTokens: string[];
            var recipes: IRecipe[];

            beforeEach(async () => {
                const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
                accessToken = accessTokens[0];

                const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
                moderatorTokens = _moderatorTokens;

                const _ingredients = await createIngredients(request, app, validIngredients, moderatorTokens[0]);

                const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
                recipes = _recipes;

            })

            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).post(`${reviewPrivateUrl()}create/`).set("authorization", `Bearer ${moderatorTokens[0]}`).send({
                    ...validReviews[0],
                    recipe: recipes[0]._id,
                } as INewReviewFrom);
                expectError(response, 401);
            });
        });


    });

    describe("Get Review", () => {

        var user: IUser;
        var accessToken: string;
        var moderatorTokens: string[];
        var ingredients: IIngredient[];
        var recipes: IRecipe[];
        var reviews: IReview[];


        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
            user = users[0];
            accessToken = accessTokens[0];

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            moderatorTokens = _moderatorTokens;

            const _ingredients = await createIngredients(request, app, validIngredients, moderatorTokens[0]);

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
            recipes = _recipes;

            const _review = await createReviews(request, app, validReviews, recipes[0], accessToken);
            reviews = _review;

        })

        describe("WHEN trying to get Review by Pagination {skip}/{limit}", () => {

            describe("WHEN trying to get review using recipeId", () => {

                it("SHOULD return 200 with Review[] obj with all having pending status ", async () => {
                    const response = await request(app).get(`${reviewPublicUrl()}recipe/${recipes[0]._id}/0/3`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                    expectValidReviewList(response, validReviews.map((review) => ({
                        ...review,
                        recipe: recipes[0]._id as string,
                    })), 1);
                });
            })

        });

        describe("WHEN trying to get Review by review id", () => {

            it("SHOULD return 200 with Review obj", async () => {
                const response = await request(app).get(`${reviewPublicUrl()}/${reviews[0]._id}`).set("authorization", `Bearer ${moderatorTokens[0]}`).send();
                expectValidReview(response, ({
                    ...validReviews[0],
                    recipe: recipes[0]._id,
                } as INewReviewFrom));
            })

            describe("WHEN trying to get Review by InValid Ingredient id", () => {
                it("SHOULD return 404 with error obj", async () => {
                    const response = await request(app).get(`${reviewPublicUrl()}75cfba229d3e6fb530a1d4d5`).send();
                    expectError(response, 404);
                });
            })
        })


    })
})
