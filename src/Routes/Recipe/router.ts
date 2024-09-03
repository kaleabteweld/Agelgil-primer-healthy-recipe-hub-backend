import express, { Request, Response } from "express";
import { MakeErrorHandler, moderatorOnly, userOnly } from "../../Util/middlewares";
import RecipeController from "./recipe.controller";
import { IUser } from "../../Schema/user/user.type";


const publicRecipeRouter = express.Router();
const privateRecipeRouter = express.Router();

publicRecipeRouter.get("/:recipeId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await RecipeController.getById(req.params.recipeId));
    }
));

privateRecipeRouter.get("/:recipeId", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _user: IUser = req['user'];
        res.json(await RecipeController.getByIdWithUser(req.params.recipeId, _user.id));
    }
));

privateRecipeRouter.get("/moderator/:recipeId", moderatorOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const _moderator: IUser = req['moderator'];
        res.json(await RecipeController.getByIdWithModerator(req.params.recipeId, _moderator.id));
    }
));

publicRecipeRouter.get("/carbs/:recipeId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await RecipeController.carbs(req.params.recipeId));
    }
));

publicRecipeRouter.get("/list/:filter/:skip/:limit", MakeErrorHandler(
    async (req: any, res: Response) => {
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        const filter = req.params.filter;
        res.json(await RecipeController.list({ skip, limit }, filter));
    }
));

privateRecipeRouter.get("/moderator/list/:skip/:limit/:filter", moderatorOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const moderator = req['moderator'];
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        const filter = req.params.filter;
        res.json(await RecipeController.moderatoList({ skip, limit }, filter));
    }
));

publicRecipeRouter.post("/user/search/:page", MakeErrorHandler(
    async (req: any, res: Response) => {
        const page = Number.parseInt(req.params.page);
        res.json(await RecipeController.search(req.body, page));
    }
));

publicRecipeRouter.post("/moderator/search/:page", MakeErrorHandler(
    async (req: any, res: Response) => {
        const page = Number.parseInt(req.params.page);
        res.json(await RecipeController.moderatorSearch(req.body, page));
    }
));

privateRecipeRouter.get("/recommendation/:time/:skip/:limit", userOnly, MakeErrorHandler(
    async (req: any, res: Response) => {
        const user: IUser = req['user'];
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        const time = req.params.time;
        res.json(await RecipeController.recommendation(user, time, { skip, limit }));
    }
));

publicRecipeRouter.get("/similar/:recipeId/:page", MakeErrorHandler(
    async (req: any, res: Response) => {
        const recipeId = req.params.recipeId;
        const page = Number.parseInt(req.params.page);
        res.json(await RecipeController.similar(recipeId, page));
    }
));

// publicRecipeRouter.patch("/addEmbedding/:recipeId", MakeErrorHandler(
//     async (req: any, res: Response) => {
//         res.json(await RecipeController.addEmbedding(req.params.recipeId));
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
        const _user: IUser = req['user'];
        res.json(await RecipeController.update(req.body, req.params.recipeId, _user));
    }
));

publicRecipeRouter.use("/recipe", publicRecipeRouter);
privateRecipeRouter.use("/recipe", privateRecipeRouter);


export { publicRecipeRouter, privateRecipeRouter } 