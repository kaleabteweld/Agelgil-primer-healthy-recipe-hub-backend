import mongoose from 'mongoose'
import { INotification, INotificationMethods, INotificationModel } from './notification.schema.type';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';

export const notificationSchema = new mongoose.Schema<INotification, INotificationModel, INotificationMethods>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    review: {
        review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
        rating: Number,
        comment: String
    }
}, {
    timestamps: true,
    methods: {

    },
    statics: {

    }
});

notificationSchema.plugin<any>(mongooseErrorPlugin)


const NotificationModel = mongoose.model<INotification, INotificationModel>("notification", notificationSchema);
export default NotificationModel;

