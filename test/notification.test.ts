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
    newValidUser,
    notificationPublicUrl,
    notificationPrivateUrl,
    expectValidNotificationList,
} from './common';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';
import { IRecipe } from '../src/Schema/Recipe/recipe.type';
import { INewReviewFrom, IReview } from '../src/Schema/Review/review.type';
import { IModerator } from '../src/Schema/Moderator/moderator.type';

const redisCache = RedisCache.getInstance();

const app = makeServer();


describe('Notification', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {

        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe("Creating Notification", () => {
        var user: IUser[];
        var accessToken: string[];
        var recipes: IRecipe[];

        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser, newValidUser2]);
            user = users;
            accessToken = accessTokens;

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);

            const _ingredients = await createIngredients(request, app, validIngredients, _moderatorTokens[0]);

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken[0]);
            recipes = _recipes;

        })

        describe("WHEN a user reviews a recipe", () => {
            var review: IReview;

            beforeEach(async () => {
                const _review = await createReviews(request, app, [{
                    rating: 5,
                    comment: "This is a great recipe",
                }], recipes[0], accessToken[1]);
                review = _review[0];
            })

            it("SHOULD create a notification for the recipe owner", async () => {
                const res = await request(app)
                    .get(`${notificationPrivateUrl()}user/0/10`)
                    .set("Authorization", `Bearer ${accessToken[0]}`);

                expectValidNotificationList(res, 1);
            })

            it("SHOULD not create a notification for other users", async () => {
                const res = await request(app)
                    .get(`${notificationPrivateUrl()}user/0/10`)
                    .set("Authorization", `Bearer ${accessToken[1]}`)
                    .expect(200);

                expect(res.body.body).toHaveLength(0);
            })

            // it("SHOULD not create a notification for the user who reviewed the recipe", async () => {
            //     const res = await request(app)
            //         .get(`/api/notifications`)
            //         .set("Authorization", `Bearer ${accessToken}`)
            //         .expect(200);

            //     expect(res.body).toHaveLength(1);
            //     expect(res.body[0].type).toBe("RECIPE_REVIEW");
            //     expect(res.body[0].recipeId).toBe(recipe._id.toString());
            //     expect(res.body[0].from).toBe(user._id.toString());
            // })

            // it("SHOULD not create a notification for other users", async () => {
            //     const res = await request(app)
            //         .get(`/api/notifications`)
            //         .set("Authorization", `Bearer ${moderatorTokens[0]}`)
            //         .expect(200);

            //     expect(res.body).toHaveLength(0);
            // })
        })

    });

    describe("Get Notification", () => {

    })
})
