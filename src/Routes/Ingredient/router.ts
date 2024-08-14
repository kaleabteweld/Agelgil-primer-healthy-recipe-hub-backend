import express, { Request, Response } from "express";
import { MakeErrorHandler, userOnly } from "../../Util/middlewares";
import IngredientController from "./Ingredient.controller";
import { IUser } from "../../Schema/user/user.type";


const publicIngredientsRouter = express.Router();
const privateIngredientsRouter = express.Router();

publicIngredientsRouter.get("/:ingredientsId", MakeErrorHandler(
    async (req: any, res: Response) => {
        res.json(await IngredientController.getById(req.params.ingredientsId));
    }
));

publicIngredientsRouter.get("/list/:skip/:limit", MakeErrorHandler(
    async (req: any, res: Response) => {
        const skip = Number.parseInt(req.params.skip);
        const limit = Number.parseInt(req.params.limit);
        res.json(await IngredientController.list({ skip, limit }));
    }
));





publicIngredientsRouter.use("/ingredients", publicIngredientsRouter);
privateIngredientsRouter.use("/ingredients", privateIngredientsRouter);


export { publicIngredientsRouter, privateIngredientsRouter } 