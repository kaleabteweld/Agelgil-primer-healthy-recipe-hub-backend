export interface errorResponse {
    msg: string
    type: string
    statusCode: number
}
export interface ValidationError extends errorResponse {
    attr: string
}

export function isValidationError(error: errorResponse): error is ValidationError {
    return (error as ValidationError).attr !== undefined;
}

export function errorFactory(error: errorResponse): errorResponse {
    return error;
}
export function isErrRes(error: any): error is errorResponse {
    return error.statusCode !== undefined;
}
export function ValidationErrorFactory(error: errorResponse, attr: string): ValidationError {

    return <ValidationError>{
        ...error,
        attr
    }
}