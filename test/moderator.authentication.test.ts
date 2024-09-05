import { connectDB, dropCollections, dropDB } from "./util";
import request from "supertest";
import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { loginUrl, logoutUrl, refreshTokenUrl, sighupUrl, newValidModeratorSignUp, newValidModeratorLogin } from "./common";
import { makeServer } from "../src/Util/Factories";
import RedisCache from "../src/Util/cache/redis";
import { verifyAccessToken, verifyRefreshToken } from "../src/Util/jwt";
import { IModerator, IModeratorSignUpFrom } from "../src/Schema/Moderator/moderator.type";
import { UserType } from "../src/Util/jwt/jwt.types";

const app = makeServer();
const redisCache = RedisCache.getInstance();

const newValidModeratorSignUpWithOutPassword: Omit<IModeratorSignUpFrom, "password"> = { ...newValidModeratorSignUp }
delete ((newValidModeratorSignUpWithOutPassword as any).password);


describe('Moderator Authentication', () => {

    beforeAll(() => {
        return Promise.all([connectDB(), redisCache.connect()]);
    });

    afterAll(() => {
        return Promise.all([dropDB(), redisCache.disconnect()]);
    });

    afterEach(async () => {
        return await dropCollections();
    });

    describe("SignUp", () => {

        describe("WHEN Moderator enters valid inputs THEN Moderator sign up ", () => {

            it("Should return 200", async () => request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp).expect(200));

            it("Should return Moderator object", async () => {
                const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
                expect(response.body).toMatchObject({ ...newValidModeratorSignUpWithOutPassword });

            });

            describe("Should be valid Access Token in header WHEN Moderator enters valid inputs", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
                    expect(response.header).toHaveProperty("authorization");

                    const accessToken = response.header.authorization.split(" ")[1];
                    expect(accessToken).toBeTruthy();
                });


            });

            describe("Should be valid Refresh token in header WHEN Moderator enters valid inputs", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    expect(refreshToken).toBeTruthy();
                });

                it("Should be set in Cache", async () => {
                    const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const Moderator: any = response.body;

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);

                    expect(Moderator).toBeTruthy();
                    expect(cacheRefreshToken).toBe(refreshToken);
                });

            });
        })

        describe("WHEN Moderator enters invalid inputs THEN Moderator Dose NOT sign up ", () => {

            it("should return 400", async () => request(app).post(sighupUrl(UserType.moderator)).send({}).expect(400));

            it("should return Validation error message", async () => {
                const response = await request(app).post(sighupUrl(UserType.moderator)).send({});
                expect(response.body.error).toBeDefined();

                const error = response.body.error;
                expect(error).toBeTruthy();
                expect(error).toMatchObject({ msg: expect.any(String), type: "validation", attr: expect.any(String) });
            });

            it("should not set Authentication header", async () => {
                const response = await request(app).post(sighupUrl(UserType.moderator)).send({});
                expect(response.header).not.toHaveProperty("authorization");
            });

            it("should not set Refresh token", async () => {
                const response = await request(app).post(sighupUrl(UserType.moderator)).send({});
                expect(response.header).not.toHaveProperty("refreshtoken");
            });

        });
    })

    describe("Login", () => {

        beforeEach(() => {
            return request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp)
        });

        describe("WHEN Moderator enters valid inputs THEN Moderator login ", () => {

            it("Should return 200", async () => request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin).expect(200));

            it("Should return Moderator object", async () => {
                const response = await request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin);
                expect(response.body).toMatchObject({ ...newValidModeratorSignUpWithOutPassword });
            });

            describe("WHEN Moderator enters valid inputs THEN Authentication header is set", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin);
                    expect(response.header).toHaveProperty("authorization");

                    const accessToken = response.header.authorization.split(" ")[1];
                    expect(accessToken).toBeTruthy();
                });

                it("Should be valid", async () => {
                    const response = await request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin);
                    expect(response.header).toHaveProperty("authorization");

                    const accessToken = response.header.authorization.split(" ")[1];
                    const Moderator = await verifyAccessToken(accessToken, UserType.moderator);
                    expect(Moderator).toBeTruthy();

                    expect(response.body).toMatchObject({ ...newValidModeratorSignUpWithOutPassword });
                });

            });

            describe("WHEN Moderator enters valid inputs THEN Refresh token is set", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    expect(refreshToken).toBeTruthy();
                });

                it("Should be set in Cache", async () => {
                    const response = await request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const Moderator: any = response.body;

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);

                    expect(Moderator).toBeTruthy();
                    expect(response.body).toMatchObject({ ...newValidModeratorSignUpWithOutPassword });

                    expect(cacheRefreshToken).toBe(refreshToken);
                });

                it("Should be valid", async () => {
                    const response = await request(app).post(loginUrl(UserType.moderator)).send(newValidModeratorLogin);
                    expect(response.header).toHaveProperty("refreshtoken");
                });
            });
        });

        describe("WHEN Moderator enters invalid inputs THEN Moderator does't login ", () => {

            it("should return 400", async () => request(app).post(loginUrl(UserType.moderator)).send({}).expect(400));

            it("Should return Validation error message", async () => {
                const response = await request(app).post(loginUrl(UserType.moderator)).send({});
                expect(response.body.error).toBeDefined();

                const error = response.body.error;
                expect(error).toBeTruthy();
                expect(error).toMatchObject({ msg: expect.any(String), type: "validation", attr: expect.any(String) });
            });

            it("Should return Invalid Email or Password error message", async () => {
                const response = await request(app).post(loginUrl(UserType.moderator)).send({ email: "abc1@gmail.com", password: "12345678" });
                expect(response.body.error).toBeDefined();

                const error = response.body.error;
                expect(error).toBeTruthy();
                expect(error).toMatchObject({ msg: "Invalid Email or Password", type: expect.any(String) });
            });

            it("Should not set Authentication header", async () => {
                const response = await request(app).post(loginUrl(UserType.moderator)).send({});
                expect(response.header).not.toHaveProperty("authorization");
            });

            it("should not set Refresh token", async () => {
                const response = await request(app).post(loginUrl(UserType.moderator)).send({});
                expect(response.header).not.toHaveProperty("refreshtoken");
            });

        });
    });

    describe("Refresh Token", () => {

        var Moderator: IModerator;
        var ModeratorRefreshToken: string;

        beforeEach(async () => {
            const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
            Moderator = response.body;
            ModeratorRefreshToken = response.header.refreshtoken.split(" ")[1];
        })

        describe("WHEN Moderator refresh a valid token THEN Moderator gets new accessToken and refreshToken", () => {

            it("Should return 200", async () => {
                const response = await request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorRefreshToken}`)
                expect((response).status).toBe(200);
            });

            it("Should have header AccessToken and Refreshtoken", async () => {

                const response = await request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorRefreshToken}`);
                expect(response.header).toHaveProperty("authorization");
                expect(response.header).toHaveProperty("refreshtoken");
            });

            it("Should have valid header AccessToken and Refreshtoken", async () => {

                const response = await request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorRefreshToken}`)

                expect(response.header).toHaveProperty("authorization");
                expect(response.header).toHaveProperty("refreshtoken");

                const accessToken = response.header.authorization.split(" ")[1];
                const refreshToken = response.header.refreshtoken.split(" ")[1];

                let Moderator = await verifyAccessToken(accessToken, UserType.moderator);
                expect(Moderator).toBeTruthy();
                Moderator = await verifyRefreshToken(refreshToken, UserType.moderator);
                expect(Moderator).toBeTruthy();

                ModeratorRefreshToken = refreshToken;

            });


            describe("WHEN Moderator refresh a valid token THEN token MUST be set on Cache", () => {

                it("Should exist on Cache ", async () => {
                    const response = await request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorRefreshToken}`);
                    const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);

                    expect(cacheRefreshToken).toBeTruthy();
                    expect(response.header).toHaveProperty("refreshtoken");

                    const newRefreshToken = response.header.refreshtoken.split(" ")[1];

                    expect(cacheRefreshToken).toBe(newRefreshToken);

                    ModeratorRefreshToken = newRefreshToken;
                });

                it("Should be in sync with Cache", async () => {
                    //TODO: compare old token with new token

                    const response = await request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorRefreshToken}`);
                    const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);
                    const newRefreshToken = response.header.refreshtoken.split(" ")[1];

                    expect(cacheRefreshToken).toBeTruthy();
                    expect(cacheRefreshToken).toBe(newRefreshToken);

                });
            })

        });

        describe("WHEN Moderator refresh an invalid token THEN Moderator gets 400", () => {

            it("should return 401", async () => request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', "").expect(400));

            it("Should Not change header AccessToken and Refreshtoken ", async () => {
                const response = await request(app).get(refreshTokenUrl(UserType.moderator)).set('authorization', `Bearer `);
                const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);

                expect(cacheRefreshToken).toBeTruthy();
                expect(response.header).not.toHaveProperty("authorization");
            })

        });

    });

    describe("Logout", () => {

        var Moderator: IModerator;
        var ModeratorAccessToken: string;

        beforeEach(async () => {

            const response = await request(app).post(sighupUrl(UserType.moderator)).send(newValidModeratorSignUp);
            Moderator = response.body;
            ModeratorAccessToken = response.header.authorization.split(" ")[1];
        })

        describe("WHEN a valid Moderator logout THEN Moderator token is remove", () => {


            it("Should return 200", async () => {
                const response = await request(app).delete(logoutUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorAccessToken}`)
                expect((response).status).toBe(200);
            });

            it("Should remove Refresh Token token from Cache", async () => {
                const response = await request(app).delete(logoutUrl(UserType.moderator)).set('authorization', `Bearer ${ModeratorAccessToken}`)
                const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);
                expect(cacheRefreshToken).toBeFalsy();
            });

        });

        describe("WHEN an invalid Moderator logout THEN Moderator token is NOT remove", () => {

            it("should return 401", async () => request(app).delete(logoutUrl(UserType.moderator)).set('authorization', "Bearer ").expect(401));

            it("Should only remove token from Cache if valid", async () => {
                await request(app).delete(logoutUrl(UserType.moderator)).set('authorization', `Bearer `)
                const cacheRefreshToken = await redisCache.getRefreshToken(Moderator.id);
                expect(cacheRefreshToken).toBeTruthy();
            });

        })

    });

})
