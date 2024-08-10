import * as bcrypt from "bcrypt";
import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory, errorFactory, isValidationError } from "../../Types/error"
import { BSONError } from 'bson';
import { EStatus, IModerator, IModeratorUpdateFrom } from "./moderator.type";
import { MakeValidator } from "../../Util";


export async function encryptPassword(this: IModerator, password?: string): Promise<String> {

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

export async function checkPassword(this: IModerator, password: string): Promise<boolean> {

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

export function validator<T>(moderatorInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, moderatorInput);
}

export async function getByEmail(this: mongoose.Model<IModerator>, email: string): Promise<IModerator> {
    const moderator = await this.findOne({ email });
    if (moderator == null) {
        throw ValidationErrorFactory({
            msg: "Invalid Email or Password",
            statusCode: 404,
            type: "Validation"
        }, "")
    }
    return moderator;
}

export async function getById(this: mongoose.Model<IModerator>, _id: string): Promise<IModerator> {
    try {
        const moderator = await this.findById(new mongoose.Types.ObjectId(_id));
        if (moderator == null) {
            throw ValidationErrorFactory({
                msg: "moderator not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return moderator;
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

export async function removeByID(this: mongoose.Model<IModerator>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "moderator not found",
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

export async function update(this: mongoose.Model<IModerator>, _id: string, mwIModerator: IModeratorUpdateFrom, populatePath?: string | string[]): Promise<IModerator | null> {

    try {
        var newDoc: any = {};
        if (mwIModerator.password) {
            const newPassword = await (encryptPassword.bind({} as any))(mwIModerator.password);
            newDoc = await this.findByIdAndUpdate(_id, { ...mwIModerator, password: newPassword }, { new: true, overwrite: true });
        } else {
            newDoc = await this.findByIdAndUpdate(_id, mwIModerator, { new: true, overwrite: true });
        }
        if (populatePath) await newDoc?.populate(populatePath)
        return newDoc;
    } catch (error) {
        throw error;
    }
}

export async function setStatus(this: mongoose.Model<IModerator>, _id: string, status: EStatus): Promise<IModerator | null> {

    try {
        var newDoc: any = await this.findByIdAndUpdate(_id, { status }, { new: true, overwrite: true });
        return newDoc;
    } catch (error) {
        throw error;
    }
}
