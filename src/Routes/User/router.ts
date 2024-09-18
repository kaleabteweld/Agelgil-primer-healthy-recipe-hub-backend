import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly, moderatorOnly } from "../../Util/middlewares";
import UserController from "./user.controller";
import { IUser } from "../../Schema/user/user.type";


const publicUserRouter = express.Router();
const privateUserRouter = express.Router();

privateUserRouter.get("/", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await UserController.getById(_user.id as any));
    }
));

privateUserRouter.patch("/update", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await UserController.update(req.body, _user.id));
    }
));

publicUserRouter.get("/id/:id", MakeErrorHandler(
    async (req: Request, res: Response) => {
        res.json(await UserController.getById(req.params.id));
    }
));

privateUserRouter.get("/bookedRecipes/:skip/:limit", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        res.json(await UserController.bookedRecipes(_user.id as any, { skip, limit }));
    }
));

privateUserRouter.get("/myRecipe/:status/:skip/:limit", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        const status = req.params.status;
        res.json(await UserController.myRecipes(_user.id, status, { skip, limit }));
    }
));

privateUserRouter.patch("/bookedRecipes/toggle/:recipeId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        const recipeId = req.params.recipeId;
        res.json(await UserController.toggleBookedRecipes(_user.id as any, recipeId));
    }
));

privateUserRouter.get("/list/:page/:verified", moderatorOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _moderator: IUser = req['moderator'];
        const page = Number.parseInt(req.params.page);
        const verified = req.params.verified;
        res.json(await UserController.users(page, verified));
    }
));

publicUserRouter.post("/search/:page", MakeErrorHandler(
    async (req: any, res: Response) => {
        const page = Number.parseInt(req.params.page);
        res.json(await UserController.usersSearch(req.body, page));
    }
));
publicUserRouter.use("/user", publicUserRouter);
privateUserRouter.use("/user", privateUserRouter);


export { publicUserRouter, privateUserRouter } 