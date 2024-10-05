import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly } from "../../Util/middlewares";
import NotificationController from "./notification.controller";
import { IUser } from "../../Schema/user/user.type";


const publicNotificationRouter = express.Router();
const privateNotificationRouter = express.Router();

publicNotificationRouter.get("/:notificationId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await NotificationController.getById(req.params.reviewId));
    }
));

privateNotificationRouter.get("/user/:skip/:limit", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        res.json(await NotificationController.userNotifications(_user, { skip, limit }));
    }
));

privateNotificationRouter.get("/user/count", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await NotificationController.userNotificationCount(_user));
    }
));

privateNotificationRouter.patch("/markAsRead/:notificationId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        const notificationId = req.params.notificationId;
        res.json(await NotificationController.markAsRead(notificationId, _user));
    }
));


publicNotificationRouter.use("/notification", publicNotificationRouter);
privateNotificationRouter.use("/notification", privateNotificationRouter);


export { publicNotificationRouter, privateNotificationRouter } 