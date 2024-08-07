import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../user/user.type";
import { IRecipe } from "../Recipe/recipe.type";

export interface IReview extends mongoose.Document {
    user: {
        user: Schema.Types.ObjectId | IUser;
        full_name: string;
        profile_img: string;
    },
    recipe: Schema.Types.ObjectId | IRecipe;
    comment: string;
    rating: number;
}

export interface IReviewMethods {
}

export interface IReviewDocument extends IReview, IReviewMethods, mongoose.Document { }

export interface IReviewModel extends mongoose.Model<IReviewDocument> {
    validator<T>(userInput: T, schema: Joi.ObjectSchema<T>): Promise<any>
    getById(_id: string): Promise<IReviewDocument>
    update(_id: string, newUser: IReviewUpdateFrom, populatePath?: string | string[]): Promise<IReviewDocument | null>
    removeByID(_id: string): Promise<void>
}

export interface INewReviewFrom {
    user: string
    recipe: string;
    comment: string;
    rating: number;
}

export interface IReviewUpdateFrom extends Partial<INewReviewFrom> {
}


