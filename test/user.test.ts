import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { connectDB, dropCollections, dropDB } from './util';
import request from "supertest";
import { makeServer } from '../src/Util/Factories';
import RedisCache from '../src/Util/cache/redis';
import { IUser } from '../src/Schema/user/user.type';
import { createIngredients, createModerators, createRecipes, createUsers, expectError, expectValidRecipeCardList, loginUrl, newValidModeratorSignUp, newValidUser, newValidUser2, sighupUrl, userPrivateUrl, userPublicUrl, validIngredients, validRecipes } from './common';
import { UserType } from '../src/Util/jwt/jwt.types';
import { ERecipeStatus, IRecipe } from '../src/Schema/Recipe/recipe.type';

const redisCache = RedisCache.getInstance();


const app = makeServer();

describe('User', () => {

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

        var users: IUser[] = [];
        var accessTokens: string[];

        beforeEach(async () => {
            const { accessTokens: ats, users: usrs } = await createUsers(request, app, [newValidUser]);
            accessTokens = ats;
            users = usrs

        })

        describe("WHEN trying to get User by there ID in JWT", () => {

            describe("WHEN trying to get User by valid User id", () => {

                it("SHOULD return the User with that id", async () => {

                    const userResponse = await request(app).get(userPrivateUrl(UserType.user)).set("authorization", `Bearer ${accessTokens[0]}`).send();
                    expect(userResponse.status).toBe(200);

                    const checkValidUser = { ...newValidUser }
                    delete (checkValidUser as any)["password"]
                    expect(userResponse.body.body).toMatchObject({ ...checkValidUser });
                })
            })

            describe("WHEN trying to get User by InValid organizer id", () => {

                it("SHOULD return 401 with error obj", async () => {
                    const userResponse = await request(app).get(userPrivateUrl(UserType.user)).send();
                    expectError(userResponse, 401);
                });

                describe("WHEN trying to get User by InValid JWT", () => {
                    it("SHOULD return 401 with error obj", async () => {

                        const invalidKWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                        const userResponse = await request(app).get(userPrivateUrl(UserType.user)).set("authorization", `Bearer ${invalidKWT}`).send();
                        expectError(userResponse, 401);

                    })
                })
            })
        })

        describe("WHEN trying to get User by there ID in URL", () => {

            describe("WHEN trying to get User by valid User id", () => {

                it("SHOULD return the User with that id", async () => {
                    const userResponse = await request(app).get(`${userPublicUrl(UserType.user)}id/${users[0].id}`).send();
                    expect(userResponse.status).toBe(200);
                    const checkValidUser = { ...newValidUser }
                    delete (checkValidUser as any)["password"]
                    expect(userResponse.body.body).toMatchObject({ ...checkValidUser });
                })
            })

            describe("WHEN trying to get User by InValid User id", () => {

                it("SHOULD return 404 with error obj", async () => {
                    const userResponse = await request(app).get(`${userPublicUrl(UserType.user)}id/123`).send();
                    expectError(userResponse, 400);
                });
            })
        });

    });

    describe("Update", () => {

        var users: IUser[] = [];
        var accessTokens: string[];

        beforeEach(async () => {
            const { accessTokens: ats, users: usrs } = await createUsers(request, app, [newValidUser]);
            accessTokens = ats;
            users = usrs

        })

        describe("WHEN Login in as a User", () => {

            describe("WHEN user try to update there info", () => {

                it("SHOULD update only one Attributes Not the rest and return 200", async () => {
                    let response = await request(app).patch(`${userPrivateUrl(UserType.user)}update`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                        name: "kolo"
                    });
                    const userResponse = await request(app).get(userPrivateUrl(UserType.user)).set("authorization", `Bearer ${accessTokens[0]}`).send();
                    const checkValidUser = { ...newValidUser }
                    delete (checkValidUser as any)["password"];

                    expect(userResponse.body.body).toMatchObject({ ...checkValidUser });
                });

                describe("WHEN user try to update there Password", () => {

                    it("SHOULD update password and Not Login with old password", async () => {
                        let response = await request(app).patch(`${userPrivateUrl(UserType.user)}update`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                            password: "password123321"
                        });
                        const userResponse = await request(app).post(loginUrl(UserType.user)).set("authorization", `Bearer ${accessTokens[0]}`).send({
                            email: users[0].email,
                            password: users[0].password
                        });

                        expectError(userResponse, 400)

                    });

                    it("SHOULD update password and only Login with new password", async () => {
                        await request(app).patch(`${userPrivateUrl(UserType.user)}update`).set('authorization', `Bearer ${accessTokens[0]}`).send({
                            password: "password123321"
                        });
                        const userResponse = await request(app).post(loginUrl(UserType.user)).send({
                            email: users[0].email,
                            password: "password123321"
                        });
                        console.log({ userResponse: userResponse.body })

                        expect(userResponse.status).toBe(200)

                    });

                });

            });

        });

        describe("WHEN not Login in as a Organizer", () => {

            it("SHOULD return a 401 status code AND Error obj", async () => {
                const response = await request(app).patch(`${userPrivateUrl(UserType.user)}update`).send({});
                expectError(response, 401);
            });

            describe("WHEN Login in as a Moderator", () => {

                var user: IUser;
                var organizerAccessToken: string;

                beforeEach(async () => {
                    const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
                    user = response.body;
                    organizerAccessToken = response.header.authorization.split(" ")[1];
                })

                it("SHOULD return a 401 status code AND Error obj", async () => {
                    const response = await request(app).patch(`${userPrivateUrl(UserType.user)}update`).set('authorization', `Bearer ${organizerAccessToken}`).send({});
                    expectError(response, 401);
                })
            })

        });

    })

    describe("BookedRecipes", () => {
        var user: IUser;
        var accessToken: string;
        var recipes: IRecipe[];

        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
            user = users[0];
            accessToken = accessTokens[0];

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);

            const _ingredients = await createIngredients(request, app, validIngredients, _moderatorTokens[0]);

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
            recipes = _recipes;

        })

        describe("WHEN user try to toggle there Booked Recipes", () => {
            it("SHOULD return the User Booked Recipes and add to user book list", async () => {
                const _userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}bookedRecipes/toggle/${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                expect(_userResponse.status).toBe(200);
                expect(_userResponse.body.body).toContain(recipes[0]._id);

                const userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}bookedRecipes/0/1`).set("authorization", `Bearer ${accessToken}`).send();
                expect(userResponse.status).toBe(200);
                expect(userResponse.body.body.length).toBe(1);

                expectValidRecipeCardList(userResponse, 1);
            });

            it("SHOULD return the User Booked Recipes and remove from user book list", async () => {
                await request(app).patch(`${userPrivateUrl(UserType.user)}bookedRecipes/toggle/${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                const userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}bookedRecipes/toggle/${recipes[0]._id}`).set("authorization", `Bearer ${accessToken}`).send();
                expect(userResponse.status).toBe(200);
                expect(userResponse.body.body).not.toContain(recipes[0]._id);

                const _userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}bookedRecipes/0/1`).set("authorization", `Bearer ${accessToken}`).send();
                expect(_userResponse.status).toBe(200);
                expect(_userResponse.body.body.length).toBe(0);
            });
        });
    });

    describe("MyRecipes", () => {
        var user: IUser;
        var accessToken: string;
        var recipes: IRecipe[];

        beforeEach(async () => {
            const { users, accessTokens } = await createUsers(request, app, [newValidUser2]);
            user = users[0];
            accessToken = accessTokens[0];

            const { accessTokens: _moderatorTokens } = await createModerators(request, app, [newValidModeratorSignUp]);

            const _ingredients = await createIngredients(request, app, validIngredients, _moderatorTokens[0]);

            const _recipes = await createRecipes(request, app, validRecipes, _ingredients, accessToken);
            recipes = _recipes;

        })

        describe("WHEN user try to get there Recipes", () => {
            it("SHOULD return the User Recipes " + ERecipeStatus.pending, async () => {
                const userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}myRecipe/${ERecipeStatus.pending}/0/1`).set("authorization", `Bearer ${accessToken}`).send();
                expect(userResponse.status).toBe(200);
                expect(userResponse.body.body.length).toBe(1);
                expectValidRecipeCardList(userResponse, 1);
            });

            it("SHOULD return the User Recipes " + ERecipeStatus.verified, async () => {
                const userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}myRecipe/${ERecipeStatus.verified}/0/1`).set("authorization", `Bearer ${accessToken}`).send();
                expect(userResponse.status).toBe(200);
                expect(userResponse.body.body.length).toBe(0);
            });

            it("SHOULD return the User Recipes " + ERecipeStatus.rejected, async () => {
                const userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}myRecipe/${ERecipeStatus.rejected}/0/1`).set("authorization", `Bearer ${accessToken}`).send();
                expect(userResponse.status).toBe(200);
                expect(userResponse.body.body.length).toBe(0);
            });

        });
    });


    // describe("Follow", () => {
    //     var users: IUser[] = [];
    //     var organizers: IOrganizer[] = [];
    //     var userAccessTokens: string[];
    //     var organizerAccessTokens: string[];

    //     beforeEach(async () => {
    //         const { accessTokens: ats, users: usrs } = await createUsers(request, app, [newValidUser]);
    //         const { accessTokens: ats2, organizers: orgs } = await createOrganizer(request, app, [newValidModeratorSignUp]);
    //         userAccessTokens = ats;
    //         users = usrs
    //         organizerAccessTokens = ats2;
    //         organizers = orgs
    //     })

    //     describe("WHEN User trying to follow an Organizer", () => {

    //         it("SHOULD add the User to the Organizer list of Followers", async () => {
    //             const userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //             expect(userResponse.status).toBe(200)
    //             expect(userResponse.body.body.followers).toContain(users[0].id)
    //             expect(userResponse.body.body.followersCount).toBe(1)
    //         });

    //         it("SHOULD add the Organizer to the User list of following", async () => {
    //             let userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //             expect(userResponse.status).toBe(200)

    //             userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //             expect(userResponse.body.body.followingOrganizers[0]).toMatchObject({
    //                 name: organizers[0].name,
    //                 logoURL: organizers[0].logoURL,
    //                 organizer: organizers[0].id
    //             })
    //             expect(userResponse.body.body.followingCount).toBe(1)
    //         });

    //         describe("WHEN User is trying to follow BUT is a follower", () => {

    //             it("SHOULD remove the User on the Organizer list of Followers", async () => {
    //                 let userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 expect(userResponse.status).toBe(200)

    //                 userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 expect(userResponse.body.body.followingOrganizers).not.toContain(organizers[0].id)
    //                 expect(userResponse.body.body.followingCount).toBe(0)
    //             });

    //             it("SHOULD remove the Organizer on the User list of following", async () => {
    //                 let userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 expect(userResponse.status).toBe(200)
    //                 expect(userResponse.body.body.followers).not.toContain(users[0].id)
    //                 expect(userResponse.body.body.followersCount).toBe(0)
    //             });
    //         })
    //     })

    //     describe("WHEN User Flows Organizer", () => {

    //         describe("WHEN Organizer updates his profile", () => {

    //             it("SHOULD update Organizer info on User followingOrganizers list", async () => {
    //                 const userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 const response = await request(app).patch(`${userPrivateUrl(UserType.moderator)}update`).set('authorization', `Bearer ${organizerAccessTokens[0]}`).send({
    //                     name: "kolo-enterprise",
    //                 });

    //                 const _userResponse = await request(app).get(userPrivateUrl(UserType.user)).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //                 expect(_userResponse.body.body.followingOrganizers.length).toBe(1)
    //                 expect(_userResponse.body.body.followingOrganizers[0]).toMatchObject({
    //                     name: "kolo-enterprise",
    //                     logoURL: organizers[0].logoURL,
    //                     organizer: organizers[0].id,
    //                 })
    //             })
    //         })
    //     })
    // })

    // describe('Notification', () => {
    //     var users: IUser[] = [];
    //     var organizers: IOrganizer[] = [];
    //     var userAccessTokens: string[];
    //     var organizerAccessTokens: string[];
    //     var events: IEvent[] = [];

    //     beforeEach(async () => {
    //         const { accessTokens: ats, users: usrs } = await createUsers(request, app, [newValidUser, newValidUser2]);
    //         const { accessTokens: ats2, organizers: orgs } = await createOrganizer(request, app, [newValidModeratorSignUp]);
    //         userAccessTokens = ats;
    //         users = usrs
    //         organizerAccessTokens = ats2;
    //         organizers = orgs

    //         const userResponse = await request(app).patch(`${userPrivateUrl(UserType.user)}follow/organizer/${organizers[0].id}`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //     })

    //     describe("WHEN Organizer Post an Event And User follow organizer", () => {

    //         it("SHOULD add the Event to the User Notifications Queue", async () => {

    //             const { events: evs } = await createEvents(request, app, [newValidCategory], 2, organizerAccessTokens[0]);
    //             events = evs;

    //             const userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}notifications/0/1`).set("authorization", `Bearer ${userAccessTokens[0]}`).send();
    //             expect(userResponse.status).toBe(200)
    //             expect(userResponse.body.body.length).toBeGreaterThanOrEqual(1);
    //             expect(userResponse.body.body[0]).toMatchObject({
    //                 title: `new Event: \"${events[0].name}\" from ${organizers[0].name}`,
    //                 body: events[0].description,
    //                 organizer: organizers[0].id,
    //                 event: events[0].id
    //             })
    //         });
    //     })

    //     describe("WHEN Organizer Post an Event And User DOES NOT follow organizer", () => {

    //         it("SHOULD NOT Change the Event to the User Notifications Queue", async () => {

    //             const { events: evs } = await createEvents(request, app, [newValidCategory], 2, organizerAccessTokens[0]);
    //             events = evs;

    //             const userResponse = await request(app).get(`${userPrivateUrl(UserType.user)}notifications/0/1`).set("authorization", `Bearer ${userAccessTokens[1]}`).send();
    //             expect(userResponse.status).toBe(200)
    //             expect(userResponse.body.body.length).toBe(0);
    //         });
    //     })
    // })
});