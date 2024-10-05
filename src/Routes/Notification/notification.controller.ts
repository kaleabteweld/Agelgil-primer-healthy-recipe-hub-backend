
import NotificationModel from "../../Schema/Notification/notification.schema";
import { INotification } from "../../Schema/Notification/notification.type";
import { IUser } from "../../Schema/user/user.type";
import { IResponseType } from "../../Types";


export default class NotificationController {

    static async getById(notificationId: string = ""): Promise<IResponseType<INotification | null>> {
        return { body: ((await NotificationModel.getById(notificationId))?.toJSON() as any) };
    }

    static async userNotifications(user: IUser, { skip = 0, limit = 10 }): Promise<IResponseType<INotification[]>> {
        return {
            body: (await NotificationModel
                .find({ user: user.id })
                .sort({ createdAt: -1, isRead: 1 })
                .populate("user")
                .skip(skip)
                .limit(limit)
                .exec()
            )
        };
    }

    static async markAsRead(notificationId: string, user: IUser): Promise<IResponseType<INotification>> {
        const notification = await NotificationModel.getById(notificationId);
        await notification.checkIfUserOwnsNotification(user)
        return { body: (await notification.markAsRead()).toJSON() as any };
    }

    static async userNotificationCount(user: IUser): Promise<IResponseType<number>> {
        return { body: await NotificationModel.countDocuments({ user: user.id, isRead: false }) };
    }
}
