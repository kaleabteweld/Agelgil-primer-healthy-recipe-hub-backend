import express from "express";
import appRouter from "../Routes";
import { errorMiddleWare } from "./middlewares";
import helmet from "helmet";
import Cors from "cors";

export function makeServer() {
    const app = express();

    app.use(Cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "RefreshToken"],
    }))
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