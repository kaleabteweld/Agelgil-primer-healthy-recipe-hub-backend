import { connectDB, dropCollections, dropDB } from "./util";
import request from "supertest";
import { describe, expect, beforeEach, afterEach, beforeAll, afterAll, it } from '@jest/globals';
import { loginUrl, logoutUrl, refreshTokenUrl, sighupUrl, newValidUser, ValidUser1Login } from "./common";
import { makeServer } from "../src/Util/Factories";
import RedisCache from "../src/Util/cache/redis";
import { UserType } from "../src/Util/jwt/jwt.types";
import { verifyAccessToken, verifyRefreshToken } from "../src/Util/jwt";
import { IUser, IUserSignUpFrom } from "../src/Schema/User/user.type";

const app = makeServer();
const redisCache = RedisCache.getInstance();

const newValidUserWithOutPassword: Omit<IUserSignUpFrom, "password"> = { ...newValidUser }
delete ((newValidUserWithOutPassword as any).password);


describe('User Authentication', () => {

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

        describe("WHEN user enters valid inputs THEN user sign up ", () => {

            it("Should return 200", async () => request(app).post(sighupUrl(UserType.user)).send(newValidUser).expect(200));

            it("Should return user object", async () => {
                const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
                expect(response.body).toMatchObject({ ...newValidUserWithOutPassword });

            });

            describe("Should be valid Access Token in header WHEN user enters valid inputs", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
                    expect(response.header).toHaveProperty("authorization");

                    const accessToken = response.header.authorization.split(" ")[1];
                    expect(accessToken).toBeTruthy();
                });


            });

            describe("Should be valid Refresh token in header WHEN user enters valid inputs", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    expect(refreshToken).toBeTruthy();
                });

                it("Should be set in Cache", async () => {
                    const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const user: any = response.body;

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    const cacheRefreshToken = await redisCache.getRefreshToken(user.id);

                    expect(user).toBeTruthy();
                    expect(cacheRefreshToken).toBe(refreshToken);
                });

            });
        })

        describe("WHEN user enters invalid inputs THEN user Dose NOT sign up ", () => {

            it("should return 400", async () => request(app).post(sighupUrl(UserType.user)).send({}).expect(400));

            it("should return Validation error message", async () => {
                const response = await request(app).post(sighupUrl(UserType.user)).send({});
                expect(response.body.error).toBeDefined();

                const error = response.body.error;
                expect(error).toBeTruthy();
                expect(error).toMatchObject({ msg: expect.any(String), type: "validation", attr: expect.any(String) });
            });

            it("should not set Authentication header", async () => {
                const response = await request(app).post(sighupUrl(UserType.user)).send({});
                expect(response.header).not.toHaveProperty("authorization");
            });

            it("should not set Refresh token", async () => {
                const response = await request(app).post(sighupUrl(UserType.user)).send({});
                expect(response.header).not.toHaveProperty("refreshtoken");
            });

        });
    })

    describe("Login", () => {

        beforeEach(() => {
            return request(app).post(sighupUrl(UserType.user)).send(newValidUser)
        });

        describe("WHEN user enters valid inputs THEN user login ", () => {

            it("Should return 200", async () => request(app).post(loginUrl(UserType.user)).send(ValidUser1Login).expect(200));

            it("Should return user object", async () => {
                const response = await request(app).post(loginUrl(UserType.user)).send(ValidUser1Login);

                expect(response.body).toMatchObject({ ...newValidUserWithOutPassword });
            });

            describe("WHEN user enters valid inputs THEN Authentication header is set", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(loginUrl(UserType.user)).send(ValidUser1Login);
                    expect(response.header).toHaveProperty("authorization");

                    const accessToken = response.header.authorization.split(" ")[1];
                    expect(accessToken).toBeTruthy();
                });

                it("Should be valid", async () => {
                    const response = await request(app).post(loginUrl(UserType.user)).send(ValidUser1Login);
                    expect(response.header).toHaveProperty("authorization");

                    const accessToken = response.header.authorization.split(" ")[1];
                    const user = await verifyAccessToken(accessToken, UserType.user);
                    expect(user).toBeTruthy();

                    expect(response.body).toMatchObject({ ...newValidUserWithOutPassword });
                });

            });

            describe("WHEN user enters valid inputs THEN Refresh token is set", () => {

                it("Should be set", async () => {
                    const response = await request(app).post(loginUrl(UserType.user)).send(ValidUser1Login);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    expect(refreshToken).toBeTruthy();
                });

                it("Should be set in Cache", async () => {
                    const response = await request(app).post(loginUrl(UserType.user)).send(ValidUser1Login);
                    expect(response.header).toHaveProperty("refreshtoken");

                    const user: any = response.body;

                    const refreshToken = response.header.refreshtoken.split(" ")[1];
                    const cacheRefreshToken = await redisCache.getRefreshToken(user.id);

                    expect(user).toBeTruthy();
                    expect(response.body).toMatchObject({ ...newValidUserWithOutPassword });

                    expect(cacheRefreshToken).toBe(refreshToken);
                });

                it("Should be valid", async () => {
                    const response = await request(app).post(loginUrl(UserType.user)).send(ValidUser1Login);
                    expect(response.header).toHaveProperty("refreshtoken");
                });
            });
        });

        describe("WHEN user enters invalid inputs THEN user does't login ", () => {

            it("should return 400", async () => request(app).post(loginUrl(UserType.user)).send({}).expect(400));

            it("Should return Validation error message", async () => {
                const response = await request(app).post(loginUrl(UserType.user)).send({});
                expect(response.body.error).toBeDefined();

                const error = response.body.error;
                expect(error).toBeTruthy();
                expect(error).toMatchObject({ msg: expect.any(String), type: "validation", attr: expect.any(String) });
            });

            it("Should return Invalid Email or Password error message", async () => {
                const response = await request(app).post(loginUrl(UserType.user)).send({ email: "abc1@gmail.com", password: "12345678" });
                expect(response.body.error).toBeDefined();

                const error = response.body.error;
                expect(error).toBeTruthy();
                expect(error).toMatchObject({ msg: "Invalid Email or Password", type: expect.any(String) });
            });

            it("Should not set Authentication header", async () => {
                const response = await request(app).post(loginUrl(UserType.user)).send({});
                expect(response.header).not.toHaveProperty("authorization");
            });

            it("should not set Refresh token", async () => {
                const response = await request(app).post(loginUrl(UserType.user)).send({});
                expect(response.header).not.toHaveProperty("refreshtoken");
            });

        });
    });

    describe("Refresh Token", () => {

        var user: IUser;
        var userRefreshToken: string;

        beforeEach(async () => {
            const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
            user = response.body;
            userRefreshToken = response.header.refreshtoken.split(" ")[1];
        })

        describe("WHEN user refresh a valid token THEN user gets new accessToken and refreshToken", () => {

            it("Should return 200", async () => {
                const response = await request(app).get(refreshTokenUrl(UserType.user)).set('authorization', `Bearer ${userRefreshToken}`)
                expect((response).status).toBe(200);
            });

            it("Should have header AccessToken and Refreshtoken", async () => {

                const response = await request(app).get(refreshTokenUrl(UserType.user)).set('authorization', `Bearer ${userRefreshToken}`);
                expect(response.header).toHaveProperty("authorization");
                expect(response.header).toHaveProperty("refreshtoken");
            });

            it("Should have valid header AccessToken and Refreshtoken", async () => {

                const response = await request(app).get(refreshTokenUrl(UserType.user)).set('authorization', `Bearer ${userRefreshToken}`)

                expect(response.header).toHaveProperty("authorization");
                expect(response.header).toHaveProperty("refreshtoken");

                const accessToken = response.header.authorization.split(" ")[1];
                const refreshToken = response.header.refreshtoken.split(" ")[1];

                let user = await verifyAccessToken(accessToken, UserType.user);
                expect(user).toBeTruthy();
                user = await verifyRefreshToken(refreshToken, UserType.user);
                expect(user).toBeTruthy();

                userRefreshToken = refreshToken;

            });


            describe("WHEN user refresh a valid token THEN token MUST be set on Cache", () => {

                it("Should exist on Cache ", async () => {
                    const response = await request(app).get(refreshTokenUrl(UserType.user)).set('authorization', `Bearer ${userRefreshToken}`);
                    const cacheRefreshToken = await redisCache.getRefreshToken(user.id);

                    expect(cacheRefreshToken).toBeTruthy();
                    expect(response.header).toHaveProperty("refreshtoken");

                    const newRefreshToken = response.header.refreshtoken.split(" ")[1];

                    expect(cacheRefreshToken).toBe(newRefreshToken);

                    userRefreshToken = newRefreshToken;
                });

                it("Should be in sync with Cache", async () => {
                    //TODO: compare old token with new token

                    const response = await request(app).get(refreshTokenUrl(UserType.user)).set('authorization', `Bearer ${userRefreshToken}`);
                    const cacheRefreshToken = await redisCache.getRefreshToken(user.id);
                    const newRefreshToken = response.header.refreshtoken.split(" ")[1];

                    expect(cacheRefreshToken).toBeTruthy();
                    expect(cacheRefreshToken).toBe(newRefreshToken);

                });
            })

        });

        describe("WHEN user refresh an invalid token THEN user gets 400", () => {

            it("should return 401", async () => request(app).get(refreshTokenUrl(UserType.user)).set('authorization', "").expect(400));

            it("Should Not change header AccessToken and Refreshtoken ", async () => {
                const response = await request(app).get(refreshTokenUrl(UserType.user)).set('authorization', `Bearer `);
                const cacheRefreshToken = await redisCache.getRefreshToken(user.id);

                expect(cacheRefreshToken).toBeTruthy();
                expect(response.header).not.toHaveProperty("authorization");
            })

        });

    });

    describe("Logout", () => {

        var user: IUser;
        var userAccessToken: string;

        beforeEach(async () => {

            const response = await request(app).post(sighupUrl(UserType.user)).send(newValidUser);
            user = response.body;
            userAccessToken = response.header.authorization.split(" ")[1];
        })

        describe("WHEN a valid user logout THEN user token is remove", () => {


            it("Should return 200", async () => {
                const response = await request(app).delete(logoutUrl(UserType.user)).set('authorization', `Bearer ${userAccessToken}`)
                expect((response).status).toBe(200);
            });

            it("Should remove Refresh Token token from Cache", async () => {
                const response = await request(app).delete(logoutUrl(UserType.user)).set('authorization', `Bearer ${userAccessToken}`)
                const cacheRefreshToken = await redisCache.getRefreshToken(user.id);
                expect(cacheRefreshToken).toBeFalsy();
            });

        });

        describe("WHEN an invalid user logout THEN user token is NOT remove", () => {

            it("should return 401", async () => request(app).delete(logoutUrl(UserType.user)).set('authorization', "Bearer ").expect(401));

            it("Should only remove token from Cache if valid", async () => {
                await request(app).delete(logoutUrl(UserType.user)).set('authorization', `Bearer `)
                const cacheRefreshToken = await redisCache.getRefreshToken(user.id);
                expect(cacheRefreshToken).toBeTruthy();
            });

        })

    });

})
