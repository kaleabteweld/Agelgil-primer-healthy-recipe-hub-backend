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

    const options: swaggerJsdoc.Options = {
        swaggerDefinition: {
            openapi: '3.0.1',
            info: {
                title: 'Shop.net API',
                version: '1.0.0',
                description: 'API documentation for Shop.net',
            },
            servers: [
                {
                    url: `http://localhost:${process.env.APP_PORT || 5000}/Api/v1`,
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    }
                },
                schemas: {
                },
            },
            security: [{
                bearerAuth: []
            }],
            securityDefinitions: {
                bearerAuth: {
                    type: 'apiKey',
                    name: 'Authorization',
                    scheme: 'bearer',
                    in: 'header',
                },
            },
        },
        apis: ['./src/Domains/*/router.ts'],
    };

    const specs = swaggerJsdoc(options);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

    return app;
}