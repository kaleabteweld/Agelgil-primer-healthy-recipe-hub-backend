
import Jwt from 'jsonwebtoken'
import { Response } from "express";
import { TokenSecret } from "../../Util";
import { TokenType, UserType } from "./jwt.types";
import RedisCache from '../cache/redis';


const redisCache = RedisCache.getInstance();

export async function MakeTokens(user: any, userType: UserType) {

    try {
        const tokenKey = TokenSecret(userType, TokenType.accessToken);
        const refreshKey = TokenSecret(userType, TokenType.refreshToken);
        if (tokenKey === undefined || refreshKey === undefined) throw Error("No Env");

        const accessToken = Jwt.sign({ id: user.id, type: userType }, tokenKey, { expiresIn: "2h", });
        const refreshToken = Jwt.sign({ id: user.id }, refreshKey, { expiresIn: "2w", });

        await redisCache.removeRefreshToken(user.id);

        const ttl: number = (Jwt.decode(refreshToken) as Jwt.JwtPayload).exp ?? 145152000;

        await redisCache.addRefreshToken(refreshToken, user.id, ttl);


        return { accessToken, refreshToken }
    } catch (error: any) {
        throw {
            msg: error.message ?? "No Valid Token",
            statusCode: 400,
            type: "token"
        }
    }

}

export async function verifyAccessToken<T>(token: string, userType: UserType): Promise<T> {

    try {
        const decoded = Jwt.decode(token, { complete: true });
        if (decoded === null) throw Error("No Valid Token");
        if (!Object.keys((decoded?.payload as Jwt.JwtPayload)).includes("id")) throw Error("No Valid Token");

        const userId = (decoded?.payload as Jwt.JwtPayload).id;
        if (userId == undefined) throw Error("No Valid Token");

        const tokenKey = TokenSecret(userType, TokenType.accessToken);
        if (tokenKey === undefined) throw Error("No Env");

        const jwtDecoded = Jwt.verify(token, tokenKey ?? "");
        return jwtDecoded as T;

    } catch (error: any) {
        console.log("[-] verifyAccessToken error", error);
        throw {
            msg: error.message ?? "No Valid Token",
            statusCode: 400,
            type: "token"
        }
    }


}

export async function verifyRefreshToken<T>(_refreshToken: string, userTye: UserType): Promise<T> {
    try {

        const decoded = Jwt.decode(_refreshToken, { complete: true });
        if (decoded === null) throw Error("No Valid Token");
        if (!Object.keys((decoded?.payload as Jwt.JwtPayload)).includes("id")) throw Error("No Valid Token");

        const userId = (decoded?.payload as Jwt.JwtPayload).id;
        if (userId == undefined) throw Error("No Valid Token");

        const refreshToken = await redisCache.getRefreshToken(userId);

        if ((refreshToken === undefined || refreshToken === null) || _refreshToken !== refreshToken) throw Error("No Valid Token [Cache]")

        const refreshKey = TokenSecret(userTye, TokenType.refreshToken);
        if (refreshKey === undefined) throw Error("No Env");

        const user = await Jwt.verify(refreshToken, refreshKey);
        return user as T;
    } catch (error: any) {
        throw {
            msg: error.message ?? "No Valid Token",
            statusCode: 400,
            type: "token"
        }
    }

}

export function makeAuthHeaders(res: Response, headers: { accessToken: string, refreshToken: string }) {
    res.header("Authorization", "Bearer " + headers.accessToken);
    res.header("RefreshToken", "Bearer " + headers.refreshToken);
}

export function removeRefreshToken(userId: string) {
    redisCache.removeRefreshToken(userId);
}
