import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly } from "../../Util/middlewares";
import MealPlannerController from "./mealPlanner.controller";
import { IUser } from "../../Schema/user/user.type";


const publicMealPlannerRouter = express.Router();
const privateMealPlannerRouter = express.Router();


publicMealPlannerRouter.get("/:mealPlanId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await MealPlannerController.getById(req.params.mealPlanId));
    }
));

privateMealPlannerRouter.post("/weekPlan/:skip/:limit", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await MealPlannerController.weekPlan(_user));
    }
));

privateMealPlannerRouter.post("/dayPlan/:skip/:limit", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await MealPlannerController.dayPlan(_user));
    }
));

privateMealPlannerRouter.post("/add/:mealPlanId/:mealTime/:recipeId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await MealPlannerController.add(_user, req.params.mealPlanId, req.params.mealTime, req.params.recipeId));
    }
));

privateMealPlannerRouter.delete("/mealPlanId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await MealPlannerController.removeByID(_user, req.params.mealPlanId));
    }
));

privateMealPlannerRouter.delete("/remove/:mealPlanId/:mealTime/:recipeId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await MealPlannerController.remove(_user, req.params.mealPlanId, req.params.mealTime, req.params.recipeId));
    }
));

privateMealPlannerRouter.get("/carbs/:mealPlanId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await MealPlannerController.carbs(req.params.mealPlanId));
    }
));


publicMealPlannerRouter.get("/list/:skip/:limit", MakeErrorHandler(
    async (req: any, res: Response) => {
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        res.json(await MealPlannerController.list({ skip, limit }));
    }
));


privateMealPlannerRouter.use("/mealPlanner", publicMealPlannerRouter);
privateMealPlannerRouter.use("/mealPlanner", privateMealPlannerRouter);


export { publicMealPlannerRouter, privateMealPlannerRouter }