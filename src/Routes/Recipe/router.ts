import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly } from "../../Util/middlewares";
import RecipeController from "./recipe.controller";
import { IUser } from "../../Schema/user/user.type";


const publicRecipeRouter = express.Router();
const privateRecipeRouter = express.Router();

publicRecipeRouter.get("/:recipeId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await RecipeController.getById(req.params.recipeId));
    }
));

publicRecipeRouter.get("/carbs/:recipeId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await RecipeController.carbs(req.params.recipeId));
    }
));

publicRecipeRouter.get("/list/:skip/:limit", MakeErrorHandler(
    async (req: any, res: Response) => {
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        res.json(await RecipeController.list({ skip, limit }));
    }
));

publicRecipeRouter.post("/search/:page", MakeErrorHandler(
    async (req: any, res: Response) => {
        const page = Number.parseInt(req.params.page);
        res.json(await RecipeController.search(req.body, page));
    }
));

// publicRecipeRouter.get("/recommendation/:skip/:limit", userOnly, MakeErrorHandler(
//     async (req: any, res: Response) => {
//         const skip = Number.parseInt(req.params.skip);
//         const limit = Number.parseInt(req.params.limit);
//         res.json(await RecipeController.list({ skip, limit }));
//     }
// ));

privateRecipeRouter.post("/create", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await RecipeController.create(req.body, _user));
    }
));

privateRecipeRouter.patch("/update/:recipeId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await RecipeController.update(req.body, req.params.recipeId));
    }
));

publicRecipeRouter.use("/recipe", publicRecipeRouter);
privateRecipeRouter.use("/recipe", privateRecipeRouter);


export { publicRecipeRouter, privateRecipeRouter } 