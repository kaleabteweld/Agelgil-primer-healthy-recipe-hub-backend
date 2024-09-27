import mongoose from "mongoose";
import { IReviewDocument } from "../Review/review.type";
import { IUser } from "../user/user.type";

export interface INotification extends mongoose.Document {
    user: mongoose.Types.ObjectId | IUser;
    review: {
        review: mongoose.Types.ObjectId | IReviewDocument;
        rating: number;
        comment: string;
    };
}

//Dynamic methods
export interface INotificationMethods {
}

// Extend the Document type with IUserMethods
export interface INotificationDocument extends INotification, INotificationMethods, mongoose.Document {
}

// statics methods
export interface INotificationModel extends mongoose.Model<INotificationDocument> {

}