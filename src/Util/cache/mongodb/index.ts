import mongoose, { Schema, Document } from 'mongoose';
import { ValidationErrorFactory, errorResponse } from '../../../Types/error';
import { UserType } from '../../jwt/jwt.types';
import { IToken } from './cache.type';


const tokenSchema = new Schema<IToken>({
    userId: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    ttl: { type: Number, required: true }
});
const TokenModel = mongoose.model<IToken>('Token', tokenSchema);

export default class MongodbCache {

    public static async disconnect() {
        await mongoose.disconnect();
    }

    static async addRefreshToken(refreshToken: string, userId: string, ttl: number) {
        try {
            await TokenModel.findOneAndUpdate(
                { userId },
                { refreshToken, createdAt: new Date(), ttl },
                { upsert: true, new: true }
            );
        } catch (error: any) {
            console.log("[-] MongodbCache Error ", error);
            const _error: errorResponse = {
                msg: error.msg ?? "MongodbCache Error",
                statusCode: 500,
                type: "MongoDB",
            }

            throw _error
        }

    }

    static async getRefreshToken(userId: string) {
        try {
            const result = await TokenModel.findOne({ userId });
            return result == null ? null : result.refreshToken;
        } catch (error: any) {
            console.log("[-] MongodbCache Error ", error);

            const _error: errorResponse = {
                msg: error.msg ?? "MongodbCache Error",
                statusCode: 500,
                type: "MongoDB",
            }
            throw _error;
        }
    }

    static async removeRefreshToken(userId: string) {
        try {
            await TokenModel.findOneAndDelete({ userId });
        } catch (error: any) {
            console.log("[-] MongodbCache Error ", error);
            const _error: errorResponse = {
                msg: error.msg ?? "MongodbCache Error",
                statusCode: 500,
                type: "MongoDB",
            }
        }
    }
}
