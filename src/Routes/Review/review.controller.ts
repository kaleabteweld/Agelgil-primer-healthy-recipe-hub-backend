
import RecipeModel from "../../Schema/Recipe/recipe.schema";
import ReviewModel from "../../Schema/Review/review.schema";
import { INewReviewFrom, IReview, IReviewUpdateFrom } from "../../Schema/Review/review.type";
import { newReviewSchema, reviewUpdateSchema } from "../../Schema/Review/review.validation";
import UserModel from "../../Schema/user/user.schema";
import { IUser } from "../../Schema/user/user.type";
import { IPagination, IResponseType } from "../../Types";


export default class ReviewController {

    static async create(_review: INewReviewFrom, user: IUser): Promise<IResponseType<IReview>> {

        const _user = await UserModel.getById(user.id as any);
        await ReviewModel.validator(_review, newReviewSchema);

        _review = {
            ..._review,
            user: {
                user: _user?._id,
                profile_img: _user?.profile_img,
                full_name: _user?.full_name
            }
        } as any;

        const review = await new ReviewModel((_review));
        await review.save();

        return { body: (review.toJSON() as any) }
    }

    static async recipeReviews(recipeId: string, { skip, limit }: IPagination): Promise<IResponseType<IReview[]>> {
        return { body: await RecipeModel.getRecipesReview(recipeId, { skip, limit }) }
    }

    static async update(_review: IReviewUpdateFrom, reviewId: string): Promise<IResponseType<IReview | null>> {

        await ReviewModel.validator(_review, reviewUpdateSchema)
        const Review = await ReviewModel.getById(reviewId);
        const updateReview = await ReviewModel.update(Review.id, _review)
        return { body: (updateReview as any).toJSON() }
    }

    static async getById(reviewId: string = ""): Promise<IResponseType<IReview | null>> {
        return { body: ((await ReviewModel.getById(reviewId))?.toJSON() as any) };
    }

    static async removeById(reviewId: string, user: IReview): Promise<IResponseType<{} | null>> {
        const Review = await ReviewModel.getById(reviewId);
        await ReviewModel.removeByID(Review?.id)

        return { body: {} };

    }

}
