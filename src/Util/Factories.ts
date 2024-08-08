import express from "express";
import appRouter from "../Routes";
import { errorMiddleWare } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import swaggerJsdoc from 'swagger-jsdoc'

export function makeServer() {
    const app = express();

    app.use(helmet())
    app.disable('x-powered-by')
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static("public"));

    app.use((req, _, next) => {
        console.log("[->] ", req.method, req.url);
        next();
    })

    app.use(appRouter);
    app.use(errorMiddleWare);

    return app;
}