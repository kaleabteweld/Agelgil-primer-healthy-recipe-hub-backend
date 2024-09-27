import mongoose from 'mongoose'
import { INotification, INotificationMethods, INotificationModel } from './notification.type';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { getById, removeByID, markAsRead, checkIfUserOwnsNotification } from './notification.extended';

export const notificationSchema = new mongoose.Schema<INotification, INotificationModel, INotificationMethods>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false },
    review: {
        review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
        rating: Number,
        comment: String
    }
}, {
    timestamps: true,
    methods: {
        markAsRead,
        checkIfUserOwnsNotification,
    },
    statics: {
        getById,
        removeByID
    }
});

notificationSchema.plugin<any>(mongooseErrorPlugin)


const NotificationModel = mongoose.model<INotification, INotificationModel>("notification", notificationSchema);
export default NotificationModel;

