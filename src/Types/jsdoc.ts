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
