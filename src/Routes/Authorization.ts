import express from "express";
import { privateAuthenticationRouter, publicAuthenticationRouter } from "./Authentication";
import { privateUserRouter, publicUserRouter } from "./User";
import { privateModeratorRouter, publicModeratorRouter } from "./Moderator";
import { privateRecipeRouter, publicRecipeRouter } from "./Recipe";
import { privateReviewRouter, publicReviewRouter } from "./Review";
import { publicIngredientsRouter, privateIngredientsRouter } from "./Ingredient";
import { publicMealPlannerRouter, privateMealPlannerRouter } from "./MealPlanner";


const publicRouter = express.Router();
const privateRouter = express.Router();

publicRouter.use([publicUserRouter, publicAuthenticationRouter, publicModeratorRouter, publicRecipeRouter, publicReviewRouter, publicIngredientsRouter, publicMealPlannerRouter]);
privateRouter.use([privateUserRouter, privateAuthenticationRouter, privateModeratorRouter, privateRecipeRouter, privateReviewRouter, privateIngredientsRouter, privateMealPlannerRouter]);


export { publicRouter, privateRouter }