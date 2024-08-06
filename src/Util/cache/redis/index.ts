import { createClient, RedisClientType } from 'redis';
import { errorResponse } from '../../../Types/error';

export default class RedisCache {
    private static instance: RedisCache;
    private static client: RedisClientType;

    private constructor() {
        RedisCache.client = createClient({
            url: process.env.REDIS_URL
        });
        RedisCache.client.on('error', (err: any) => console.error('[+] Redis Client Error', err));
    }

    public static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    public async connect() {
        try {
            await RedisCache.client.connect();
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Connection Error",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Connection Error: ", error);
            throw _error;
        }
    }

    public async disconnect() {
        try {
            await RedisCache.client.quit();
            console.log("[+] Redis Client Disconnected");
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Disconnection Error",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Disconnection Error: ", error);
            throw _error;
        }
    }

    public async addRefreshToken(refreshToken: string, userId: string, ttl: number) {
        try {
            await RedisCache.client.set(userId.toString(), refreshToken, {
                EX: ttl
            });
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Error adding refresh token",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Error adding refresh token: ", error);
            throw _error;
        }
    }

    public async getRefreshToken(userId: string) {
        try {
            return await RedisCache.client.get(userId.toString());
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Error getting refresh token",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Error getting refresh token: ", error);
            throw _error;
        }
    }

    public async removeRefreshToken(userId: string) {
        try {
            await RedisCache.client.del(userId.toString());
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Error removing refresh token",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Error removing refresh token: ", error);
            throw _error;
        }
    }
}
