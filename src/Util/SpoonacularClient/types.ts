interface IngredientSearchResult {
    id: number;
    name: string;
    image: string;
};

interface IngredientSearchResponse {
    results: IngredientSearchResult[];
    offset: number;
    number: number;
    totalResults: number;
};

interface IngredientSearchParams {
    query: string;
    addChildren?: boolean;
    minProteinPercent?: number;
    maxProteinPercent?: number;
    minFatPercent?: number;
    maxFatPercent?: number;
    minCarbsPercent?: number;
    maxCarbsPercent?: number;
    metaInformation?: boolean;
    intolerances?: string;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
    language?: 'en' | 'de';
    offset?: number;
    number?: number;
}