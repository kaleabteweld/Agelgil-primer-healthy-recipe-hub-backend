import * as bcrypt from "bcrypt";
import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory, errorFactory, isValidationError } from "../../Types/error"
import { BSONError } from 'bson';
import { EStatus, IModerator, IModeratorUpdateFrom } from "./moderator.type";
import { MakeValidator } from "../../Util";
import { IPagination } from "../../Types";
import { IRecipe, TRecipeStatus } from "../Recipe/recipe.type";


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

export async function moderatedRecipes(this: mongoose.Model<IModerator>, _id: string, pagination: IPagination, status: TRecipeStatus): Promise<IRecipe[]> {

    try {
        const moderated = await this.findOne({ _id: new mongoose.Types.ObjectId(_id), moderated_recipe: { status } }).select('moderated_recipe').populate({
            path: 'recipe',
            select: 'name,description,imgs,preparationDifficulty,preferredMealTime',
            options: { limit: pagination.limit }
        }).exec();
        if (moderated == null) {
            throw ValidationErrorFactory({
                msg: "moderated not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        // TODO: test
        return moderated.moderated_recipe as any;
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

export function hasModeratedRecipe(this: IModerator, recipeId: mongoose.Types.ObjectId): boolean {
    return this.moderated_recipe.some((recipe) => (recipe.recipe as mongoose.Types.ObjectId).equals(recipeId))
};
