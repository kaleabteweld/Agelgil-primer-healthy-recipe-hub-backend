import mongoose from "mongoose";
import { IReviewDocument } from "../Review/review.type";
import { IUser } from "../user/user.type";



export interface INotification extends mongoose.Document {
    title: string;
    body: string;
}

export interface INewReviewNotificationSchema extends INotification {
    user: mongoose.Types.ObjectId | IUser;
    review: mongoose.Types.ObjectId | IReviewDocument;
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