import { DataAPIClient, Db, UUID } from "@datastax/astra-db-ts";
import { IRecipe } from '../../Schema/Recipe/recipe.type';
export class Datasx {
    private static instance: Datasx;
    private client: DataAPIClient;
    private db: Db;
    private _passive: boolean | null = null;


    private constructor(_passive?: boolean) {
        this.client = new DataAPIClient(process.env.DATASAX_ASTRA_TOKEN!);
        this.db = this.client.db(process.env.DATASAX_ASTRA_API_Endpoint!);
        if (_passive) this._passive = _passive;
        else this._passive = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
    }

    static getInstance(_passive?: boolean): Datasx {
        if (!Datasx.instance) {
            Datasx.instance = new Datasx(_passive);
        }
        return Datasx.instance;
    }

    async initNvidiaCollection() {
        try {
            const collections = await this.db.collections();
            if (collections.length > 0 && collections[0].collectionName === 'recipes') {
                return;
            }
            await this.db.createCollection('recipes', {
                vector: {
                    service: {
                        provider: 'nvidia',
                        modelName: 'NV-Embed-QA',
                    },
                },
            });
        } catch (error) {
            console.error('Error creating collection:', error);
            throw error;
        }
    }

    async generateRecipeEmbedding(recipe: IRecipe, input_type: "passage" | "query"): Promise<number[]> {
        try {
            const response = await fetch('https://ai.api.nvidia.com/v1/retrieval/nvidia/embeddings', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    input: `${recipe.name} ${recipe.description}
            ${recipe.preferredMealTime} ${recipe.preparationDifficulty} 
            ${recipe.ingredients.map(ingredientDetail => ingredientDetail.name).join(' ')}
            ${recipe.medical_condition.chronicDiseases.map(disease => disease).join(' ')} ${recipe.medical_condition.dietary_preferences.map(diet => diet).join(' ')} 
            ${recipe.medical_condition.allergies.map(allergy => allergy).join(' ')}`,
                    model: 'NV-Embed-QA',
                    input_type,
                    encoding_format: 'float',
                    truncate: 'NONE',
                    user: process.env.NVIDIA_API_USER
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to generate embeddings');
            }

            // Assuming the API returns an array of numbers as the embedding
            return result.embedding;
        } catch (error) {
            console.error('Error generating recipe embedding:', error);
            throw error;
        }
    }

    async EmbedAndSave(recipe: IRecipe,): Promise<void> {
        if (this._passive) return;
        try {
            const _recipe = await this.db.collection('recipes').findOne({ recipeId: (recipe as any)._id })
            if (_recipe) {
                return;
            }
            await this.db.collection('recipes').insertOne({
                _id: UUID.v7(),
                recipeId: (recipe as any)._id,
                name: recipe.name,
                description: recipe.description,
                preferredMealTime: recipe.preferredMealTime,
                preparationDifficulty: recipe.preparationDifficulty,
                imgs: recipe.imgs,
                rating: recipe.rating,
                $vectorize: `${recipe.name} ${recipe.description}
            ${recipe.preferredMealTime} ${recipe.preparationDifficulty} 
            ${recipe.ingredients.map(ingredientDetail => `${ingredientDetail.name} ${(ingredientDetail as any).type}`).join(' ')}
            ${recipe.medical_condition.chronicDiseases.map(disease => disease).join(' ')} ${recipe.medical_condition.dietary_preferences.map(diet => diet).join(' ')} 
            ${recipe.medical_condition.allergies.map(allergy => allergy).join(' ')}`
            });
        } catch (error) {
            console.error('Error embedding and saving recipe:', error);
            throw error;
        }


    }

    async getSuggestionsForRecipe(recipe: IRecipe, page: number, perPage: number = 10): Promise<any[]> {
        if (this._passive) return [];
        try {
            const cursor = await this.db.collection('recipes').find({
                $not: { recipeId: (recipe as any)._id }
            }, {

                sort: {
                    $vectorize: `${recipe.name} ${recipe.description}
            ${recipe.preferredMealTime} ${recipe.preparationDifficulty} 
            ${recipe.ingredients.map(ingredientDetail => `${ingredientDetail.name} (${ingredientDetail.type})`).join(' ')}
            ${recipe.medical_condition.chronicDiseases.map(disease => disease).join(' ')} ${recipe.medical_condition.dietary_preferences.map(diet => diet).join(' ')} 
            ${recipe.medical_condition.allergies.map(allergy => allergy).join(' ')}`.trim()
                },
                limit: perPage * (page + 1),
                skip: page * perPage,
                includeSimilarity: true,
            });
            return await cursor.toArray();
        } catch (error) {
            console.error('Error getting recipe suggestions:', error);
            throw error;
        }
    }

    async removeRecipe(recipe: IRecipe): Promise<void> {
        if (this._passive) return;
        try {
            await this.db.collection('recipes').deleteMany({
                recipeId: (recipe as any)._id
            });
        } catch (error) {
            console.error('Error removing recipe:', error);
            throw error;
        }
    }

    async updateRecipe(recipeId: string, recipe: IRecipe): Promise<void> {
        if (this._passive) return;
        try {
            await this.db.collection('recipes').updateOne({
                recipeId: recipeId
            }, {
                $set: {
                    name: recipe.name,
                    description: recipe.description,
                    preferredMealTime: recipe.preferredMealTime,
                    preparationDifficulty: recipe.preparationDifficulty,
                    imgs: recipe.imgs,
                    rating: recipe.rating,
                    $vectorize: `${recipe.name} ${recipe.description}
            ${recipe.preferredMealTime} ${recipe.preparationDifficulty} 
            ${recipe.ingredients.map(ingredientDetail => `${ingredientDetail.name} ${(ingredientDetail as any).type}`).join(' ')}
            ${recipe.medical_condition.chronicDiseases.map(disease => disease).join(' ')} ${recipe.medical_condition.dietary_preferences.map(diet => diet).join(' ')} 
            ${recipe.medical_condition.allergies.map(allergy => allergy).join(' ')}`
                }
            });
        } catch (error) {
            console.error('Error updating recipe:', error);
            throw error;
        }
    }
}
