import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { IReview, IReviewMethods, IReviewModel } from './review.type';
import { getById, removeByID, validator, checkIfUserHasReviewed } from './review.extended';
import { Datasx } from '../../Util/Datasx';
import Neo4jClient from '../../Util/Neo4j/neo4jClient';


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
        removeByID,
        checkIfUserHasReviewed
    },
});


reviewSchema.plugin<any>(mongooseErrorPlugin);

reviewSchema.post('save', async function (doc) {
    const recipe = await mongoose.model('Recipe').findById(doc.recipe);
    if (recipe) {
        recipe.reviews.addToSet(doc._id);
        recipe.rating = (recipe.rating + doc.rating) / recipe.reviews.length;
        recipe.totalReviews += 1;
        await recipe.save();

        await Neo4jClient.getInstance({}).updateRecipe(recipe);

        Datasx.getInstance().updateRecipe(recipe._id, recipe);
    }
})

const ReviewModel = mongoose.model<IReview, IReviewModel>('Review', reviewSchema);

export default ReviewModel;
