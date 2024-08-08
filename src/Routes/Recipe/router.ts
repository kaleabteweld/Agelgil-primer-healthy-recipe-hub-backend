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