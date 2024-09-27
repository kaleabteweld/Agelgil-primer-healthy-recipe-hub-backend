import RedisCache from ".";
import { errorResponse } from "../../../Types/error";

export class EmailOtpRedisCache {

    public async addEmailOtp(email: string, otp: string, ttl: number) {
        try {
            await RedisCache.client.set(email, otp, {
                EX: ttl
            });
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Error adding email OTP",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Error adding email OTP: ", error);
            throw _error;
        }
    }

    public async getEmailOtp(email: string) {
        try {
            return await RedisCache.client.get(email);
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Error getting email OTP",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Error getting email OTP: ", error);
            throw _error;
        }
    }

    public async removeEmailOtp(email: string) {
        try {
            await RedisCache.client.del(email);
        } catch (error: any) {
            const _error: errorResponse = {
                msg: error.msg ?? "Redis Error removing email OTP",
                statusCode: 500,
                type: "Redis",
            };
            console.error("[-] Redis Error removing email OTP: ", error);
            throw _error;
        }
    }
}