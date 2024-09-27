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

    });

    describe("Get Notification", () => {

    })
})
