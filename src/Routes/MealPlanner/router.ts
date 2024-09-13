import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly } from "../../Util/middlewares";
import MealPlannerController from "./mealPlanner.controller";
import { IUser } from "../../Schema/user/user.type";


const publicMealPlannerRouter = express.Router();
const privateMealPlannerRouter = express.Router();

privateMealPlannerRouter.post("/createMealPlan", userOnly, MakeErrorHandler(async (req: any, res: Response) => {
    const _user: IUser = req['user'];
    const mealPlan = await MealPlannerController.createMealPlan(_user, req.body);
    res.json(mealPlan);
}));

privateMealPlannerRouter.get("/mealPlan/:mealTime/:page", userOnly, MakeErrorHandler(async (req: any, res: Response) => {
    const { mealTime, page } = req.params;
    const _user: IUser = req['user'];
    const mealPlan = await MealPlannerController.getMealPlan(_user, mealTime, parseInt(page));
    res.json(mealPlan);
}));

privateMealPlannerRouter.post("/addToMealPlan/:mealTime/:recipeID", userOnly, MakeErrorHandler(async (req: any, res: Response) => {
    const { mealTime, recipeID } = req.params;
    const _user: IUser = req['user'];
    const mealPlan = await MealPlannerController.addToMealPlan(_user, mealTime, recipeID);
    res.json(mealPlan);
}));

privateMealPlannerRouter.delete("/removeFromMealPlan/:mealTime/:recipeID", userOnly, MakeErrorHandler(async (req: any, res: Response) => {
    const { mealTime, recipeID } = req.params;
    const _user: IUser = req['user'];
    const mealPlan = await MealPlannerController.removeFromMealPlan(_user, mealTime, recipeID);
    res.json(mealPlan);
}));

privateMealPlannerRouter.delete("/reset/recipes", userOnly, MakeErrorHandler(async (req: any, res: Response) => {
    const _user: IUser = req['user'];
    const mealPlan = await MealPlannerController.resetRecipes(_user);
    res.json(mealPlan);
}));

privateMealPlannerRouter.get("/nutritionGoal", userOnly, MakeErrorHandler(async (req: any, res: Response) => {
    const _user: IUser = req['user'];
    const mealPlan = await MealPlannerController.getNutritionGoal(_user);
    res.json(mealPlan);
}));


privateMealPlannerRouter.use("/mealPlanner", publicMealPlannerRouter);
privateMealPlannerRouter.use("/mealPlanner", privateMealPlannerRouter);


export { publicMealPlannerRouter, privateMealPlannerRouter }