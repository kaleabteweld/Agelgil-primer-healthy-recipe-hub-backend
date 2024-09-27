import mongoose from "mongoose";
import { IReviewDocument } from "../Review/review.type";
import { IUser } from "../user/user.type";

export interface INotification extends mongoose.Document {
    user: mongoose.Types.ObjectId | IUser;
    isRead: boolean;
    review: {
        review: mongoose.Types.ObjectId | IReviewDocument;
        rating: number;
        comment: string;
    };
}

//Dynamic methods
export interface INotificationMethods {
    markAsRead(this: INotification, _id: string): Promise<INotification>
    checkIfUserOwnsNotification(this: INotification, _id: string, user: IUser): Promise<INotification>
}

// Extend the Document type with IUserMethods
export interface INotificationDocument extends INotification, INotificationMethods, mongoose.Document {
}

// statics methods
export interface INotificationModel extends mongoose.Model<INotificationDocument> {
    getById(_id: string, populate?: string | string[]): Promise<INotification>
    removeByID(_id: string): Promise<void>
}