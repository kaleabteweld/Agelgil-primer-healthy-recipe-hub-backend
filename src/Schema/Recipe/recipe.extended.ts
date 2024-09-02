import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../Util";
import { IModeratorRecipeUpdateFrom, IRecipe, IRecipeUpdateFrom } from "./recipe.type";
import { IPagination } from "../../Types";
import { IReview } from "../Review/review.type";
import { IUser } from "../user/user.type";
import ShareableLink from "../../Util/ShareableLink";
import { IModerator } from "../Moderator/moderator.type";
import { Datasx } from "../../Util/Datasx";



export function validator<T>(recipeInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, recipeInput);
}

export async function getById(this: mongoose.Model<IRecipe>, _id: string, populate?: string | string[]): Promise<IRecipe> {
    if (ShareableLink.getInstance({}).isEncrypted(_id)) {
        _id = ShareableLink.getInstance({}).decryptId(_id);
    }
    try {
        let recipe: any = this.findById(new mongoose.Types.ObjectId(_id))
        if (populate) recipe.populate(populate)
        recipe = await recipe.exec();
        if (recipe == null) {
            throw ValidationErrorFactory({
                msg: "recipe not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return recipe;
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

export async function removeByID(this: mongoose.Model<IRecipe>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "recipe not found",
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

export async function addModerator(this: mongoose.Model<IRecipe>, _id: string, moderator: IModerator, body: IModeratorRecipeUpdateFrom): Promise<IRecipe> {
    try {
        const recipe = await this.findById(new mongoose.Types.ObjectId(_id));
        if (recipe == null) {
            throw ValidationErrorFactory({
                msg: "recipe not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        if (recipe.moderator != null && recipe.status !== "pending") {
            throw ValidationErrorFactory({
                msg: "recipe already has a moderator",
                statusCode: 400,
                type: "Validation"
            }, "_id")
        }

        const datasx = Datasx.getInstance();
        await datasx.EmbedAndSave(recipe)

        return await this.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(_id) }, {
            status: body.status,
            moderator: {
                moderator: {
                    moderator: moderator._id as mongoose.ObjectId,
                    full_name: moderator.full_name,
                    profile_img: moderator.profile_img
                },
                comment: body.comment

            },
        }, { new: true, overwrite: true }) as any;

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

export async function getRecipesReview(this: mongoose.Model<IRecipe>, _id: string, pagination: IPagination): Promise<IReview[]> {

    try {
        const recipe = await this.findById(new mongoose.Types.ObjectId(_id)).select('reviews').populate({
            path: 'reviews',
            options: { limit: pagination.limit }
        }).exec();
        if (recipe == null) {
            throw ValidationErrorFactory({
                msg: "recipe not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return recipe.reviews as IReview[];
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

export async function update(this: mongoose.Model<IRecipe>, _id: string, newRecipe: IRecipeUpdateFrom, populatePath: string | string[]): Promise<IRecipe | null> {

    try {
        const newDoc = await this.findByIdAndUpdate(_id, newRecipe, { new: true, overwrite: true });
        await newDoc?.populate(populatePath)
        return newDoc;
    } catch (error) {
        throw error;
    }
}

export async function checkIfUserOwnsRecipe(this: mongoose.Model<IRecipe>, _id: string, user: IUser): Promise<IRecipe> {
    try {
        const recipe = await this.findById(new mongoose.Types.ObjectId(_id));
        if (recipe == null) {
            throw ValidationErrorFactory({
                msg: "recipe not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        if (recipe.user.user == user._id) {
            throw ValidationErrorFactory({
                msg: "user does not own recipe",
                statusCode: 403,
                type: "Validation"
            }, "_id")
        }
        return recipe;
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

export function getRecipeByShareableLink(this: mongoose.Model<IRecipe>, recipeId: string): Promise<IRecipe> {
    if (ShareableLink.getInstance({}).isEncrypted(recipeId)) {
        return getById.bind(this)(ShareableLink.getInstance({}).decryptId(recipeId))
    }
    return getById.bind(this)(recipeId)
}
