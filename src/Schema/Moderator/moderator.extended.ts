import * as bcrypt from "bcrypt";
import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory, errorFactory, isValidationError } from "../../Types/error"
import { BSONError } from 'bson';
import { EStatus, IUser, IUserUpdateFrom } from "./moderator.type";
import { MakeValidator } from "../../Util";


export async function encryptPassword(this: IUser, password?: string): Promise<String> {

    const saltRounds: number = Number.parseInt(process.env.saltRounds || "11");
    try {
        const hashPassword = await bcrypt.hash(password ?? this.password as string, saltRounds);
        this.password = hashPassword;
        return this.password;
    } catch (error) {
        console.log("[-] Bcrypt Error", error);
        throw errorFactory({
            msg: "Bcrypt Error",
            statusCode: 418,
            type: "system"
        });

    }
}

export async function checkPassword(this: IUser, password: string): Promise<boolean> {

    try {
        const gate = await bcrypt.compare(password, this.password as string);
        if (gate === false) {
            throw ValidationErrorFactory({
                msg: "Invalid Email or Password",
                statusCode: 404,
                type: "Validation"
            }, "")
        }
        return gate;
    } catch (error: any) {

        if (isValidationError(error)) {
            throw error;
        }
        console.log("[-] Bcrypt Error", error);
        throw errorFactory({
            msg: "Bcrypt Error",
            statusCode: 418,
            type: "system"
        });
    }
}

export function validator<T>(userInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, userInput);
}

export async function getByEmail(this: mongoose.Model<IUser>, email: string): Promise<IUser> {
    const user = await this.findOne({ email });
    if (user == null) {
        throw ValidationErrorFactory({
            msg: "Invalid Email or Password",
            statusCode: 404,
            type: "Validation"
        }, "")
    }
    return user;
}

export async function getById(this: mongoose.Model<IUser>, _id: string): Promise<IUser> {
    try {
        const user = await this.findById(new mongoose.Types.ObjectId(_id));
        if (user == null) {
            throw ValidationErrorFactory({
                msg: "User not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return user;
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }

}

export async function removeByID(this: mongoose.Model<IUser>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "User not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
    } catch (error) {
        if (error instanceof BSONError) {
            throw ValidationErrorFactory({
                msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                statusCode: 400,
                type: "validation",
            }, "id");
        }
        throw error;
    }
}

export async function update(this: mongoose.Model<IUser>, _id: string, newUser: IUserUpdateFrom, populatePath?: string | string[]): Promise<IUser | null> {

    try {
        var newDoc: any = {};
        if (newUser.password) {
            const newPassword = await (encryptPassword.bind({} as any))(newUser.password);
            newDoc = await this.findByIdAndUpdate(_id, { ...newUser, password: newPassword }, { new: true, overwrite: true });
        } else {
            newDoc = await this.findByIdAndUpdate(_id, newUser, { new: true, overwrite: true });
        }
        if (populatePath) await newDoc?.populate(populatePath)
        return newDoc;
    } catch (error) {
        throw error;
    }
}

export async function setStatus(this: mongoose.Model<IUser>, _id: string, status: EStatus): Promise<IUser | null> {

    try {
        var newDoc: any = await this.findByIdAndUpdate(_id, { status }, { new: true, overwrite: true });
        return newDoc;
    } catch (error) {
        throw error;
    }
}
