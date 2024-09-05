import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';
import { IModerator } from '../src/Schema/Moderator/moderator.type';
import { createIngredients, createModerators, createUsers, expectError, expectValidIngredient, expectValidListIngredient, ingredientPrivateUrl, ingredientPublicUrl, newValidModeratorSignUp, newValidUser2, validIngredients } from './common';
import { IUser } from '../src/Schema/user/user.type';
import { IIngredient } from '../src/Schema/Ingredient/ingredient.type';

const redisCache = RedisCache.getInstance();

const app = makeServer();


describe('Ingredients', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {

        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe("Creating Ingredients", () => {
        describe("WHEN Login in as a Moderator", () => {
            var moderator: IModerator;
            var accessToken: string;

            beforeEach(async () => {
                const { moderators, accessTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
                moderator = moderators[0];
                accessToken = accessTokens[0];
            })

            describe("WHEN  the Ingredients is Invalid", () => {
                it("SHOULD return a 400 status code AND Error obj", async () => {
                    const response = await request(app).post(ingredientPrivateUrl()).set("authorization", `Bearer ${accessToken}`).send({});
                    expectError(response, 400);
                });

            });

            describe("WHEN the Ingredients is Valid", () => {

                it("SHOULD return a 200 status code AND Ingredient obj", async () => {
                    const response = await request(app).post(ingredientPrivateUrl()).set("authorization", `Bearer ${accessToken}`).send(validIngredients[0]);
                    expectValidIngredient(response, validIngredients[0]);

                });
            });

        });
        describe("WHEN not Login in as a Moderator", () => {
            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).post(ingredientPrivateUrl()).send({});
                expectError(response, 401);
            });

            describe("WHEN Login in as a User", () => {

                var user: IUser;
                var accessToken: string;
                beforeEach(async () => {
                    const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
                    user = users[0];
                    accessToken = accessTokens[0];
                })

                it("SHOULD return a 401 status code AND Error obj", async () => {
                    const response = await request(app).post(ingredientPrivateUrl()).set("authorization", `Bearer ${accessToken}`).send(validIngredients[0]);
                    expectError(response, 401);
                })
            })

        });
    });

    describe("Get Ingredients", () => {

        var Ingredients: IIngredient[] = [];
        var accessToken: string;

        beforeEach(async () => {
            const { accessTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            accessToken = accessTokens[0];

            const _Ingredients = await createIngredients(request, app, validIngredients, accessToken);
            Ingredients = _Ingredients;
        })

        describe("WHEN trying to get Ingredients by Pagination {skip}/{limit}", () => {

            it("SHOULD return a list of Ingredients Bigger then 1 and less then 3", async () => {
                const response = await request(app).get(`${ingredientPublicUrl()}list/0/3`).send();
                expectValidListIngredient(response, validIngredients, 1, 3);
            })
        });

        describe("WHEN trying to get Ingredients by Ingredient id", () => {

            describe("WHEN trying to get Ingredients by valid Ingredient id", () => {

                it("SHOULD return the Ingredients with that id", async () => {
                    const response = await request(app).get(`${ingredientPublicUrl()}byId/${Ingredients[0]._id}`).send();
                    expectValidIngredient(response, validIngredients[0]);

                })

                // describe("WHEN trying to get Ingredients by valid Ingredient id With ?withEventCount=true", () => {
                //     it("SHOULD return the Ingredients with that id and eventCount", async () => {

                //         const response = await request(app).get(`${ingredientPublicUrl()}byId/${Ingredients[0]._id}?withEventCount=true`).send();
                //         expectValidIngredient(response, validIngredients[0], {
                //             eventCount: 0
                //         });
                //     })
                // })
            })

            describe("WHEN trying to get Ingredients by InValid Ingredient id", () => {
                it("SHOULD return 404 with error obj", async () => {
                    const response = await request(app).get(`${ingredientPublicUrl()}byId/75cfba229d3e6fb530a1d4d5`).send();
                    expectError(response, 404);
                });
            })
        })

        describe("WHEN trying to get Ingredients by Ingredient Name with both [en,am]", () => {

            describe("WHEN trying to get Ingredients by valid Ingredient EN Name", () => {

                it("SHOULD return the Ingredients with that Name", async () => {
                    const response = await request(app).get(`${ingredientPublicUrl()}ingredientByName/name/${Ingredients[0].name}`).send();
                    expectValidListIngredient(response, [validIngredients[0]], 0);
                })

            })

            describe("WHEN trying to get Ingredients by valid Ingredient AN Name", () => {

                it("SHOULD return the Ingredients with that Name", async () => {
                    const response = await request(app).get(`${ingredientPublicUrl()}ingredientByName/localName/${Ingredients[0].localName}`).send();
                    expectValidListIngredient(response, [validIngredients[0]], 0);

                })

            })

            describe("WHEN trying to get Ingredients by InValid Ingredient name", () => {
                it("SHOULD return 404 with error obj", async () => {
                    const response = await request(app).get(`${ingredientPublicUrl()}ingredientByName/name/75cfba229d3e6fb530a1d4d5`).send();
                    expectValidListIngredient(response, [], 0, 1);
                });

                it("SHOULD return 404 with error obj", async () => {
                    const response = await request(app).get(`${ingredientPublicUrl()}ingredientByName/localName/75cfba229d3e6fb530a1d4d5`).send();
                    expectValidListIngredient(response, [], 0, 1);
                });
            })
        })

    });

    describe("Remove Ingredients", () => {
        var Ingredients: IIngredient[] = [];
        var accessToken: string;

        beforeEach(async () => {
            const { accessTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            accessToken = accessTokens[0];

            const _Ingredients = await createIngredients(request, app, validIngredients, accessToken);
            Ingredients = _Ingredients;
        })

        describe("WHEN Login in as a Moderator", () => {
            describe("WHEN Moderator try to remove Ingredient", () => {
                it("SHOULD remove and return 200 with the Ingredient", async () => {
                    let response = await request(app).delete(`${ingredientPrivateUrl()}remove/${Ingredients[0]._id}`).set('authorization', `Bearer ${accessToken}`).send({});
                    expect(response.status).toBe(200);

                    response = await request(app).get(`${ingredientPublicUrl()}byId/${Ingredients[0]._id}`).send();
                    expect(response.status).toBe(404)
                });
            });
        });

        describe("WHEN not Login in as a Moderator", () => {
            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).delete(`${ingredientPrivateUrl()}remove/${Ingredients[0]._id}`).send({});
                expectError(response, 401);
            });

            describe("WHEN Login in as a User", () => {
                var user: IUser;
                var accessToken: string;
                beforeEach(async () => {
                    const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
                    user = users[0];
                    accessToken = accessTokens[0];
                })

                it("SHOULD return a 401 status code AND Error obj", async () => {
                    const response = await request(app).delete(`${ingredientPrivateUrl()}remove/${Ingredients[0]._id}`).set('authorization', `Bearer ${accessToken}`).send({});
                    expectError(response, 401);
                })
            })

        });

    })

    describe("Update Ingredients", () => {
        var Ingredients: IIngredient[] = [];
        var accessToken: string;

        beforeEach(async () => {
            const { accessTokens } = await createModerators(request, app, [newValidModeratorSignUp]);
            accessToken = accessTokens[0];

            const _Ingredients = await createIngredients(request, app, validIngredients, accessToken);
            Ingredients = _Ingredients;
        })

        describe("WHEN Login in as a Moderator", () => {
            describe("WHEN Moderator try to update Ingredient", () => {
                it("SHOULD update and return 200 with the Ingredient", async () => {
                    let response = await request(app).patch(`${ingredientPrivateUrl()}${Ingredients[0]._id}`).set('authorization', `Bearer ${accessToken}`).send({
                        name: "New Name"
                    });
                    expect(response.status).toBe(200);

                    response = await request(app).get(`${ingredientPublicUrl()}byId/${Ingredients[0]._id}`).send();
                    expectValidIngredient(response, { ...validIngredients[0], name: "New Name" });
                });

            });
        });

        describe("WHEN not Login in as a Moderator", () => {
            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).patch(`${ingredientPrivateUrl()}${Ingredients[0]._id}`).send({
                    name: "New Name"
                });
                expectError(response, 401);
            });

            describe("WHEN Login in as a User", () => {
                var user: IUser;
                var accessToken: string;
                beforeEach(async () => {
                    const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
                    user = users[0];
                    accessToken = accessTokens[0];
                })

                it("SHOULD return a 401 status code AND Error obj", async () => {
                    const response = await request(app).patch(`${ingredientPrivateUrl()}${Ingredients[0]._id}`).set('authorization', `Bearer ${accessToken}`).send({
                        name: "New Name"
                    });
                    expectError(response, 401);
                })
            })

        });

    })

});