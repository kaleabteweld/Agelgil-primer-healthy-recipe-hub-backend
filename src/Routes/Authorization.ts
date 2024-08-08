import express from "express";
import { privateAuthenticationRouter, publicAuthenticationRouter } from "./Authentication";
import { privateUserRouter, publicUserRouter } from "./User";
import { publicAdminRouter, privateAdminRouter } from "./Admin";
import { publicProductRouter, privateProductRouter } from "./Product";
import { publicCategoryRouter, privateCategoryRouter } from "./Category";

const publicRouter = express.Router();
const privateRouter = express.Router();

publicRouter.use([publicUserRouter, publicAuthenticationRouter, publicProductRouter, publicAdminRouter, publicCategoryRouter]);
privateRouter.use([privateUserRouter, privateAuthenticationRouter, privateProductRouter, privateAdminRouter, privateCategoryRouter]);


export { publicRouter, privateRouter }