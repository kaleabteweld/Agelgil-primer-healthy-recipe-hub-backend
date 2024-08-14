import Joi from "joi";
import { INewReviewFrom, IReviewUpdateFrom } from "./review.type";

export const newReviewSchema = Joi.object<INewReviewFrom>({
    recipe: Joi.string().required(),
    comment: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
});

export const reviewUpdateSchema = Joi.object<IReviewUpdateFrom>({
    comment: Joi.string().optional(),
    rating: Joi.number().min(1).max(5).optional(),
});




