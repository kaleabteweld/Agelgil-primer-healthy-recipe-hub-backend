import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { IReview, IReviewMethods, IReviewModel } from './review.type';
import { getById, removeByID, validator } from './review.extended';


const reviewSchema = new Schema<IReview, IReviewModel, IReviewMethods>({
    user: {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        full_name: { type: String, },
        profile_img: { type: String, }
    },
    recipe: { type: Schema.Types.ObjectId, ref: "Recipe", },
    comment: { type: String },
    rating: { type: Number }
}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID
    }
});


reviewSchema.plugin<any>(mongooseErrorPlugin);

const ReviewModel = mongoose.model<IReview, IReviewModel>('Review', reviewSchema);

export default ReviewModel;
