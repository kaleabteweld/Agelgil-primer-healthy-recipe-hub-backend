import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly } from "../../Util/middlewares";
import ReviewController from "./review.controller";
import { IUser } from "../../Schema/user/user.type";


const publicReviewRouter = express.Router();
const privateReviewRouter = express.Router();

publicReviewRouter.get("/:reviewId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await ReviewController.getById(req.params.reviewId));
    }
));

publicReviewRouter.get("/recipe/:recipeId/:skip/:limit", MakeErrorHandler(
    async (req: any, res: Response) => {
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        const recipeId = req.params.recipeId;
        res.json(await ReviewController.recipeReviews(recipeId, { skip, limit }));
    }
));

privateReviewRouter.post("/create/:recipeId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await ReviewController.create(req.body, _user));
    }
));

publicReviewRouter.use("/review", publicReviewRouter);
privateReviewRouter.use("/review", privateReviewRouter);


export { publicReviewRouter, privateReviewRouter } 