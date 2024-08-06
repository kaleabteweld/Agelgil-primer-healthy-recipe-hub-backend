export interface IPagination {
    skip?: number,
    limit?: number,
}

export interface IPaginationPage {
    pageNumber: number,
}


export interface IResponseType<T> {
    body: T
}

export interface IResponseWithHeaderType<T> {
    body: T
    header: {
        accessToken: string
        refreshToken: string
    }
}

export interface IListResponseType<T> {
    body: T,
    pagination: IPagination
}