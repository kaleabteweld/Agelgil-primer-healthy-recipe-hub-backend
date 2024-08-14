import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../Util";
import { IIngredient } from "./ingredient.type";



export function validator<T>(ingredientInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, ingredientInput);
}

export async function getById(this: mongoose.Model<IIngredient>, _id: string): Promise<IIngredient> {
    try {
        const ingredient = await this.findById(new mongoose.Types.ObjectId(_id));
        if (ingredient == null) {
            throw ValidationErrorFactory({
                msg: "ingredient not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return ingredient;
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

export async function removeByID(this: mongoose.Model<IIngredient>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "ingredient not found",
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