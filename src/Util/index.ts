import axios from "axios";
import { errorResponse } from "../Types/error";
import crypto from 'crypto';
import { ValidationErrorFactory } from "../Types/error";
import Joi from "joi";
import { TokenType, UserType } from "./jwt/jwt.types";

export function TokenSecret(userType: UserType, tokenType: TokenType) {
    if (tokenType == TokenType.accessToken) {
        return process.env[userType.toUpperCase() + "_SECRET"];
    }
    return process.env[userType.toUpperCase() + "_REfRESH_SECRET"];
}

export async function apiCall(options: { url: string, method: string, data?: any, headers?: any }, onSuccess: Function, onError?: Function) {

    try {
        const response: any = await axios(options);
        const data = response["data"];

        if (response == undefined || data == undefined) throw Error("Empty Response");
        return onSuccess(data);

    } catch (error: any) {
        console.log("[-] Axios error ", error);
        if (onError != undefined) onError(error);

        const _err: errorResponse = {
            msg: error.message,
            statusCode: 500,
            type: "axios"
        }
        throw _err;
    }

}

export function copyObjectWithOnlyKeys(obj: any, keys: string[]) {
    return keys.reduce((acc: any, key) => {
        if (obj.hasOwnProperty(key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}
export function copyObjectWithout(obj: any, keysToRemove: string[]) {
    const keysToKeep = Object.keys(obj).filter(key => !keysToRemove.includes(key));
    return copyObjectWithOnlyKeys(obj, keysToKeep);
}

export async function MakeValidator<T>(validator: Joi.ObjectSchema<T>, obj: T, optional?: Joi.ValidationOptions) {
    const validationError: any = await validator.validate(obj, optional);
    if (validationError.error != null) {

        const _error = ValidationErrorFactory({
            msg: validationError.error?.message,
            statusCode: 400,
            type: "validation",
        }, cleanAttr(validationError.error?.message))
        throw _error;
    } else {
        return validationError.value;
    }
}

export function cleanAttr(errorMsg: string): string {
    var attr: string = errorMsg.split(" ")[0];
    attr = attr.replace('\"', "");
    attr = attr.replace('\"', "");
    return attr;
}