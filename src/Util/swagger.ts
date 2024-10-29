import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
    swaggerDefinition: {
        openapi: '3.0.1',
        info: {
            title: 'Agelgil API',
            version: '1.0.0',
            description: 'API documentation for Agelgil',
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
            schemas: {},
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

const SwaggerSpecs = swaggerJSDoc(options);

export default SwaggerSpecs;