export const Error401JsdocSchema = {
    type: 'object',
    properties: {
        error: {
            type: 'object',
            properties: {
                msg: {
                    type: 'string',
                    example: 'No Valid Token',
                },
                statusCode: {
                    type: 'number',
                    example: 401,
                },
                type: {
                    type: 'string',
                    example: 'token',
                },
            },
        },
    }
}


export const validationError = {
    type: "object",
    properties: {
        error: {
            type: "object",
            properties: {
                msg: {
                    type: "string",
                    example: "\"email\" must be a valid email"
                },
                statusCode: {
                    type: "number",
                    example: 400
                },
                type: {
                    type: "string",
                    example: "validation"
                },
                attr: {
                    type: "string",
                    example: "email"
                }
            }
        }
    }
}