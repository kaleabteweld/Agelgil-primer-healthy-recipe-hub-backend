import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory, errorFactory, isValidationError } from "../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../Util";
import { IReview } from "./review.type";



export function validator<T>(reviewInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, reviewInput);
}

export async function getById(this: mongoose.Model<IReview>, _id: string): Promise<IReview> {
    try {
        const review = await this.findById(new mongoose.Types.ObjectId(_id));
        if (review == null) {
            throw ValidationErrorFactory({
                msg: "review not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return review;
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

export async function removeByID(this: mongoose.Model<IReview>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "review not found",
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

// export async function update(this: mongoose.Model<IReview>, _id: string, rewReview: IReviewUpdateFrom, populatePath?: string | string[]): Promise<IReview | null> {

// }
