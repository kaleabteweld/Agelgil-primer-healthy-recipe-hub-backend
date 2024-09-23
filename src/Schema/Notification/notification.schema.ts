import mongoose from 'mongoose'
import { INewReviewNotificationSchema, INotification, INotificationMethods, INotificationModel } from './notification.schema.type';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';

export const notificationSchema = new mongoose.Schema<INotification, INotificationModel, INotificationMethods>({
    title: { type: String },
    body: { type: String },
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



export const newReactNotificationSchema = NotificationModel.discriminator<INewReviewNotificationSchema>('newReactNotificationS', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' }
}, { discriminatorKey: 'type' }));
