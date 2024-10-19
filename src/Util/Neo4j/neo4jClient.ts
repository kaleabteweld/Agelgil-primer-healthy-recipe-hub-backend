import neo4j, { Session, Driver } from "neo4j-driver";
import { EAllergies, EChronicDisease, EDietaryPreferences, IUser } from "../../Schema/user/user.type";
import { ERecipeStatus, IRecipe, TPreferredMealTime } from "../../Schema/Recipe/recipe.type";
import { IReview } from "../../Schema/Review/review.type";
import { IPagination } from "../../Types";
import mongoose from "mongoose";

export default class Neo4jClient {

    private static instance: Neo4jClient;
    private _passive: boolean | null = null;

    session: Session;
    driver: Driver;

    private constructor(options?: { url?: string, userName?: string, password?: string }, _passive?: boolean) {
        this.driver = neo4j.driver(
            options?.url ?? process.env.NEO4J_URL ?? "bolt://localhost:7687",
            neo4j.auth.basic(options?.userName ?? process.env.NEO4J_USER ?? "neo4j", options?.password ?? process.env.NEO4J_PASSWORD ?? "password")
        );
        console.log(`[+] Neo4j Connected at ${options?.url ?? process.env.NEO4J_URL ?? "bolt://localhost:7687"}`);
        this.session = this.driver.session({ database: process.env.NEO4J_DATABASE ?? "Agelgel" });

        if (_passive) this._passive = _passive;
        else this._passive = process.env.NODE_ENV === "test" || process.env.NODE_ENV == "development " || process.env.JEST_WORKER_ID !== undefined;
    }

    static getInstance(options: { url?: string, userName?: string, password?: string }, _passive?: boolean): Neo4jClient {
        if (!Neo4jClient.instance) {
            Neo4jClient.instance = new Neo4jClient(options);
        }
        return Neo4jClient.instance;
    }

    async recommendRecipesForUser(userId: string, time: TPreferredMealTime | 'all', pagination: IPagination) {
        try {
            const result = await this.driver.executeQuery(
                /* cypher */`
                // Match the current user's preferences, conditions, and allergies
                   MATCH (u:User {id: $userId})-[:PREFERS]->(dp:DietaryPreference)
                   MATCH (u)-[:HAS_CONDITION]->(mc:MedicalCondition)
                   MATCH (u)-[:ALLERGIC_TO]->(a:Allergy)
   
               // Find similar users based on shared preferences, conditions, or allergies
               MATCH (similarUser:User)-[:PREFERS]->(dp)
               MATCH (similarUser)-[:HAS_CONDITION]->(mc)
               MATCH (similarUser)-[:ALLERGIC_TO]->(a)
   
               //Find recipes that match the user's preferences and do not have disliked attributes
               MATCH (r:Recipe)
               WHERE 
               ($time = 'all' OR (r)-[:PREFERRED_MEAL_TIME]->(:PreferredMealTime {name: $time})) AND
               (
                   (r)-[:PREFERS]->(dp) OR 
                   NOT EXISTS((r)-[:ALLERGIC_TO]->(a)) OR
                   (r)-[:HAS_CONDITION]->(mc)
               )
   
               //Check if similar users have BOOKED or REVIEWED the recipe
               OPTIONAL MATCH (similarUser)-[:BOOKED]->(r)
               OPTIONAL MATCH (similarUser)-[:REVIEWED]->(r)
   
               //Calculate review statistics for the current user
               OPTIONAL MATCH (u)-[review:REVIEWED]->(r)
               WITH r, 
                   COUNT(CASE WHEN review.rating >= 3 THEN 1 ELSE null END) AS userPositiveReviews,  // Positive reviews by the user
                   COUNT(CASE WHEN review.rating < 3 THEN 1 ELSE null END) AS userNegativeReviews,   // Negative reviews by the user
                   
                   //Count total positive and negative reviews by similar users
                   COUNT(CASE WHEN (similarUser)-[:REVIEWED {rating: 3}]->(r) THEN 1 ELSE null END) AS similarUserPositiveReviews, 
                   COUNT(CASE WHEN (similarUser)-[:REVIEWED {rating: 1}]->(r) THEN 1 ELSE null END) AS similarUserNegativeReviews,
                   
                   //Calculate total reviews by any user
                   COUNT { MATCH (:User)-[reviewPos:REVIEWED]->(r) WHERE reviewPos.rating >= 3 RETURN 1 } AS totalPositiveReviews,
                   COUNT { MATCH (:User)-[reviewNeg:REVIEWED]->(r) WHERE reviewNeg.rating < 3 RETURN 1 } AS totalNegativeReviews
   
               //Calculate the probabilities using Naive Bayes formula components
               WITH r, 
                   userPositiveReviews,
                   userNegativeReviews,
                   similarUserPositiveReviews,
                   similarUserNegativeReviews,
                   totalPositiveReviews, 
                   totalNegativeReviews,
   
               // Prior probability P(Like) based on total reviews
               toFloat(totalPositiveReviews) / NULLIF((totalPositiveReviews + totalNegativeReviews), 0) AS P_Like,  
               
               // Conditional probability P(UserLikes | Recipe) with Laplace smoothing for user's positive reviews
               toFloat(userPositiveReviews + similarUserPositiveReviews + 1) / (NULLIF(totalPositiveReviews, 0) + 2) AS P_UserLikesGivenRecipe,  
               
               // Conditional probability P(UserDislikes | Recipe) with Laplace smoothing for user's negative reviews
               toFloat(userNegativeReviews + similarUserNegativeReviews + 1) / (NULLIF(totalNegativeReviews, 0) + 2) AS P_UserDislikesGivenRecipe  
   
               //Calculate the Naive Bayes score
               WITH r, 
                   P_Like * P_UserLikesGivenRecipe AS score
   
               WHERE score IS NOT NULL
   
               RETURN r, score
               ORDER BY score DESC
               SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit)
   
               `,
                { userId, time, skip: pagination.skip ?? 0, limit: pagination.limit ?? 10 }
            );

            const recommendations = result.records.map((record) => {
                const recipe = record.get('r').properties;
                const score = record.get('score');
                return { ...recipe, score };
            });

            return recommendations;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }

    }


    async addUser(user: IUser) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */`MERGE (u:User { 
                    id: $id,
                    email: $email, 
                    first_name: $first_name, 
                    last_name: $last_name
                })`,
                {
                    id: (user as any)._id.toString(),
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            );

            for (const medicalCondition of user.medical_condition.chronicDiseases) {
                if (medicalCondition != EChronicDisease.none)
                    await this.driver.executeQuery(
                    /* cypher */`MERGE (c:MedicalCondition {name: $medicalCondition}) 
                    WITH c
                    MATCH (u:User {id: $id})
                    MERGE (u)-[:HAS_CONDITION]->(c)`,
                        {
                            id: (user as any)._id.toString(),
                            medicalCondition: medicalCondition
                        }
                    );
            }

            for (const dietaryPreference of user.medical_condition.dietary_preferences) {
                if (dietaryPreference != EDietaryPreferences.none)
                    await this.driver.executeQuery(
                    /* cypher */`MERGE (d:DietaryPreference {name: $dietaryPreference}) 
                    WITH d
                    MATCH (u:User {id: $id})
                    MERGE (u)-[:PREFERS]->(d)`,
                        {
                            id: (user as any)._id.toString(),
                            dietaryPreference: dietaryPreference
                        }
                    );
            }

            for (const allergy of user.medical_condition.allergies) {
                if (allergy != EAllergies.none)
                    await this.driver.executeQuery(
                    /* cypher */`MERGE (a:Allergy {name: $allergy}) 
                    WITH a
                    MATCH (u:User {id: $id})
                    MERGE (u)-[:ALLERGIC_TO]->(a)`,
                        {
                            id: (user as any)._id.toString(),
                            allergy: allergy
                        }
                    );
            }
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    async updateUser(user: IUser) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */`MATCH (u:User {id: $id})
                SET u.email = $email, 
                    u.first_name = $first_name, 
                    u.last_name = $last_name`,
                {
                    id: (user as any)._id.toString(),
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            );

            await this.driver.executeQuery(
                /* cypher */`MATCH (u:User {id: $id})-[c:HAS_CONDITION]->(m:MedicalCondition)
                DELETE c`,
                {
                    id: (user as any)._id.toString()
                }
            );

            for (const medicalCondition of user.medical_condition.chronicDiseases) {
                if (medicalCondition != EChronicDisease.none)
                    await this.driver.executeQuery(
                    /* cypher */`MERGE (c:MedicalCondition {name: $medicalCondition}) 
                    WITH c
                    MATCH (u:User {id: $id})
                    MERGE (u)-[:HAS_CONDITION]->(c)`,
                        {
                            id: (user as any)._id.toString(),
                            medicalCondition: medicalCondition
                        }
                    );
            }

            await this.driver.executeQuery(
                /* cypher */`MATCH (u:User {id: $id})-[d:PREFERS]->(dp:DietaryPreference)
                DELETE d`,
                {
                    id: (user as any)._id.toString()
                }
            );

            for (const dietaryPreference of user.medical_condition.dietary_preferences) {
                if (dietaryPreference != EDietaryPreferences.none)
                    await this.driver.executeQuery(
                    /* cypher */`MERGE (d:DietaryPreference {name: $dietaryPreference}) 
                    WITH d
                    MATCH (u:User {id: $id})
                    MERGE (u)-[:PREFERS]->(d)`,
                        {
                            id: (user as any)._id.toString(),
                            dietaryPreference: dietaryPreference
                        }
                    );
            }

            await this.driver.executeQuery(
                /* cypher */`MATCH (u:User {id: $id})-[a:ALLERGIC_TO]->(al:Allergy)
                DELETE a`,
                {
                    id: (user as any)._id.toString()
                }
            );

            for (const allergy of user.medical_condition.allergies) {
                if (allergy != EAllergies.none)
                    await this.driver.executeQuery(
                    /* cypher */`MERGE (a:Allergy {name: $allergy}) 
                    WITH a
                    MATCH (u:User {id: $id})
                    MERGE (u)-[:ALLERGIC_TO]->(a)`,
                        {
                            id: (user as any)._id.toString(),
                            allergy: allergy
                        }
                    );
            }
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }


    async updateRecipe(recipe: IRecipe) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})
                SET r.img = $img,
                    r.name = $name,
                    r.preparationDifficulty = $preparationDifficulty,
                    r.description = $description,
                    r.preferredMealTime = $preferredMealTime,
                    r.rating = $rating
                `,
                {
                    id: (recipe as any)._id.toString(),
                    img: recipe.imgs[0],
                    name: recipe.name,
                    preparationDifficulty: recipe.preparationDifficulty,
                    description: recipe.description,
                    preferredMealTime: recipe.preferredMealTime,
                    rating: recipe.rating
                }
            );

            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})-[c:CONTAINS]->(i:Ingredient)
                DELETE c
                `,
                {
                    id: (recipe as any)._id.toString()
                }
            );

            for (const ingredient of recipe.ingredients) {
                await this.driver.executeQuery(
                    /* cypher */ `MERGE (i:Ingredient {name: $ingredient}) 
                    WITH i
                    MATCH (r:Recipe {id: $id})
                    MERGE (r)-[:CONTAINS {amount: $amount}]->(i)`,
                    {
                        id: (recipe as any)._id.toString(),
                        ingredient: ingredient.name,
                        amount: ingredient.amount
                    }
                );
            }

            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})-[p:PREFERRED_MEAL_TIME]->(t:PreferredMealTime)
                DELETE p
                `,
                {
                    id: (recipe as any)._id.toString()
                }
            );

            for (const preferredMealTime of recipe.preferredMealTime) {
                await this.driver.executeQuery(
                    /* cypher */ `
                    MERGE (p:PreferredMealTime {name: $preferredMealTime}) 
                    WITH p
                    MATCH (r:Recipe {id: $id})
                    MERGE (r)-[:PREFERRED_MEAL_TIME]->(p)`,
                    {
                        id: (recipe as any)._id.toString(),
                        preferredMealTime: preferredMealTime
                    }
                );
            }

            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})-[c:HAS_CONDITION]->(m:MedicalCondition)
                DELETE c
                `,
                {
                    id: (recipe as any)._id.toString()
                }
            );
        } catch (error) {
            console.error('Error updating recipe:', error);
            throw error;
        }
    }

    async removeRecipe(recipeId: string) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})
                DETACH DELETE r
                `,
                {
                    id: recipeId
                }
            );
        } catch (error) {
            console.error('Error removing recipe:', error);
            throw error;
        }
    }

    async addRecipe(recipe: IRecipe) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */ `
                MERGE (r:Recipe { 
                    id: $id,
                    img: $img,
                    name: $name, 
                    preparationDifficulty: $preparationDifficulty,
                    description: $description, 
                    preferredMealTime: $preferredMealTime,
                    rating: $rating
                })`,
                {
                    id: (recipe as any)._id.toString(),
                    img: recipe.imgs.at(0) ?? "",
                    name: recipe.name,
                    preparationDifficulty: recipe.preparationDifficulty,
                    description: recipe.description,
                    preferredMealTime: recipe.preferredMealTime,
                    rating: recipe.rating
                }
            );

            for (const ingredient of recipe.ingredients) {
                await this.driver.executeQuery(
                    /* cypher */ `MERGE (i:Ingredient {name: $ingredient}) 
                    WITH i
                    MATCH (r:Recipe {id: $id})
                    MERGE (r)-[:CONTAINS {amount: $amount}]->(i)`,
                    {
                        id: (recipe as any)._id.toString(),
                        ingredient: ingredient.name,
                        amount: ingredient.amount
                    }
                );
            }

            for (const preferredMealTime of recipe.preferredMealTime) {
                await this.driver.executeQuery(
                    /* cypher */ `
                    MERGE (p:PreferredMealTime {name: $preferredMealTime}) 
                    WITH p
                    MATCH (r:Recipe {id: $id})
                    MERGE (r)-[:PREFERRED_MEAL_TIME]->(p)`,
                    {
                        id: (recipe as any)._id.toString(),
                        preferredMealTime: preferredMealTime
                    }
                );
            }

            for (const medicalCondition of recipe.medical_condition.chronicDiseases) {
                if (medicalCondition != EChronicDisease.none)
                    await this.driver.executeQuery(
                    /* cypher */`
                    MERGE (c:MedicalCondition {name: $medicalCondition}) 
                    WITH c
                    MATCH (u:Recipe {id: $id})
                    MERGE (u)-[:HAS_CONDITION]->(c)`,
                        {
                            id: (recipe as any)._id.toString(),
                            medicalCondition: medicalCondition
                        }
                    );
            }

            for (const dietaryPreference of recipe.medical_condition.dietary_preferences) {
                if (dietaryPreference != EDietaryPreferences.none)
                    await this.driver.executeQuery(
                    /* cypher */`
                    MERGE (d:DietaryPreference {name: $dietaryPreference}) 
                    WITH d
                    MATCH (u:Recipe {id: $id})
                    MERGE (u)-[:PREFERS]->(d)`,
                        {
                            id: (recipe as any)._id.toString(),
                            dietaryPreference: dietaryPreference
                        }
                    );
            }

            for (const allergy of recipe.medical_condition.allergies) {
                if (allergy != EAllergies.none)
                    await this.driver.executeQuery(
                    /* cypher */`
                    MERGE (a:Allergy {name: $allergy}) 
                    WITH a
                    MATCH (u:Recipe {id: $id})
                    MERGE (u)-[:ALLERGIC_TO]->(a)`,
                        {
                            id: (recipe as any)._id.toString(),
                            allergy: allergy
                        }
                    );
            }

            await this.driver.executeQuery(
                /* cypher */ `
                MERGE (u:User {id: $userId}) 
                MERGE (r:Recipe {id: $recipeId})
                MERGE (r)-[:MERGED_BY]->(u)`,
                {
                    recipeId: recipe.id.toString(),
                    userId: recipe.user.user.toString(),
                }
            );
        } catch (error) {
            console.error('Error adding recipe:', error);
            throw error;
        }
    }

    async addReviewToRecipe(recipeId: string, userId: string, review: IReview) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (r:Recipe {id: $recipeId})
                MERGE (u:User {id: $userId})
                MERGE (u)-[:REVIEWED {rating: $rating, comment: $comment}]->(r)
                `,
                {
                    recipeId,
                    userId,
                    rating: review.rating,
                    comment: review.comment
                }
            );
        } catch (error) {
            console.error('Error adding review to recipe:', error);
            throw error;
        }
    }

    async addBookRecipe(userId: string, recipeId: string) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (u:User {id: $userId})
                MERGE (r:Recipe {id: $recipeId})
                MERGE (u)-[:BOOKED]->(r)
                `,
                {
                    userId,
                    recipeId
                }
            );
        } catch (error) {
            console.error('Error booking recipe:', error);
            throw error;
        }
    }

    async removeBookedRecipe(userId: string, recipeId: string) {
        if (this._passive) return;
        try {
            await this.driver.executeQuery(
                /* cypher */ `
                MATCH (u:User {id: $userId})-[b:BOOKED]->(r:Recipe {id: $recipeId})
                DELETE b
                `,
                {
                    userId,
                    recipeId
                }
            );
        } catch (error) {
            console.error('Error removing booked recipe:', error);
            throw error;
        }
    }

    async seedDatabase<T>(Models: mongoose.Model<T>[]) {
        if (this._passive) return;
        try {
            const tempBookedRecipes = []
            for (const model of Models) {
                const documents = await model.find();
                for (const document of documents) {
                    if (model.modelName === 'User') {
                        await this.addUser(document as IUser);
                        tempBookedRecipes.push({ id: (document as any)._id.toString(), bookedRecipes: (document as any).booked_recipes });
                    } else if (model.modelName === 'Recipe') {
                        if ((document as IRecipe).status == ERecipeStatus.verified) {
                            await this.addRecipe(document as IRecipe);
                        }
                    } else if (model.modelName === 'Review') {
                        await this.addReviewToRecipe((document as IReview).recipe.toString(), (document as IReview).user.user.toString(), document as IReview);
                    }
                }
            }
            for (const { bookedRecipes, id } of tempBookedRecipes) {
                for (const recipeId of bookedRecipes) {
                    await this.addBookRecipe(id, recipeId.toString());
                }
            }
        } catch (error) {
            console.error('Error seeding database:', error);
            throw error;
        }
    }

}
