import { UserType } from "../../jwt/jwt.types";

export interface IToken extends Document {
    userId: string;
    type: UserType,
    refreshToken: string;
    createdAt: Date;
    ttl: number;
}