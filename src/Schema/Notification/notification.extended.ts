import mongoose from "mongoose";
import Joi from "joi";
import { ValidationErrorFactory } from "../../Types/error"
import { BSONError } from 'bson';
import { MakeValidator } from "../../Util";
import { INotification } from "./notification.type";
import { IUser } from "../user/user.type";



export function validator<T>(notificationInput: T, schema: Joi.ObjectSchema<T>) {
    return MakeValidator<T>(schema, notificationInput);
}

export async function getById(this: mongoose.Model<INotification>, _id: string, populate?: string | string[]): Promise<INotification> {
    try {
        let notification: any = this.findById(new mongoose.Types.ObjectId(_id))
        if (populate) notification.populate(populate)
        notification = await notification.exec();
        if (notification == null) {
            throw ValidationErrorFactory({
                msg: "notification not found",
                statusCode: 404,
                type: "Validation"
            }, "_id")
        }
        return notification;
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

export async function removeByID(this: mongoose.Model<INotification>, _id: string): Promise<void> {
    try {
        const result = await this.deleteOne({ _id: new mongoose.Types.ObjectId(_id) })
        if (result.deletedCount === 0) {
            throw ValidationErrorFactory({
                msg: "notification not found",
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

export async function checkIfUserOwnsNotification(this: INotification, user: IUser): Promise<INotification> {
    try {

        if (this.user.toString() !== user.id.toString()) {
            throw ValidationErrorFactory({
                msg: "user does not own notification",
                statusCode: 403,
                type: "Validation"
            }, "_id")
        }
        return this;
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

export async function markAsRead(this: INotification): Promise<INotification> {
    try {
        this.isRead = true;
        return this.save();;
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
