import neo4j, { Session } from "neo4j-driver";
import { EAllergies, EChronicDisease, EDietaryPreferences, IUser } from "../../Schema/user/user.type";
import { IRecipe } from "../../Schema/Recipe/recipe.type";

export default class Neo4jClient {

    private static instance: Neo4jClient;
    private _passive: boolean | null = null;

    session: Session;

    private constructor(options?: { url?: string, userName?: string, password?: string }, _passive?: boolean) {
        const driver = neo4j.driver(
            options?.url ?? process.env.NEO4J_URL ?? "bolt://localhost:7687",
            neo4j.auth.basic(options?.userName ?? process.env.NEO4J_USER ?? "neo4j", options?.password ?? process.env.NEO4J_PASSWORD ?? "password")
        );
        console.log(`[+] Neo4j Connected at ${options?.url ?? process.env.NEO4J_URL ?? "bolt://localhost:7687"}`);
        this.session = driver.session({ database: process.env.NEO4J_DATABASE ?? "Agelgel" });

        if (_passive) this._passive = _passive;
        else this._passive = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
    }

    static getInstance(options: { url?: string, userName?: string, password?: string }, _passive?: boolean): Neo4jClient {
        if (!Neo4jClient.instance) {
            Neo4jClient.instance = new Neo4jClient(options);
        }
        return Neo4jClient.instance;
    }

    async recommendRecipesForUser(userId: string) {
        const result = await this.session.run(
            `
            MATCH (u:User {id: $userId})-[:HAS_DIETARY_PREFERENCE]->(dp:DietaryPreference)<-[:HAS_DIETARY_PREFERENCE]-(r:Recipe)
            WHERE NOT (u)-[:DISLIKES]->(r)
            OPTIONAL MATCH (u)-[likes:LIKES]->(r)
            RETURN r, COUNT(likes) AS likesCount
            ORDER BY likesCount DESC
            LIMIT 10
            `,
            { userId }
        );

        const recommendations = result.records.map((record) => {
            const recipe = record.get('r').properties;
            const likesCount = record.get('likesCount').toInt();
            return { ...recipe, likesCount };
        });

        return recommendations;
    }

    async addUser(user: IUser) {
        if (this._passive) return;
        try {
            await this.session.run(
                /* cypher */`CREATE (u:User { 
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
                    await this.session.run(
                    /* cypher */`MERGE (c:MedicalCondition {name: $medicalCondition}) 
                    WITH c
                    MATCH (u:User {id: $id})
                    CREATE (u)-[:HAS_CONDITION]->(c)`,
                        {
                            id: (user as any)._id.toString(),
                            medicalCondition: medicalCondition
                        }
                    );
            }

            for (const dietaryPreference of user.medical_condition.dietary_preferences) {
                if (dietaryPreference != EDietaryPreferences.none)
                    await this.session.run(
                    /* cypher */`MERGE (d:DietaryPreference {name: $dietaryPreference}) 
                    WITH d
                    MATCH (u:User {id: $id})
                    CREATE (u)-[:PREFERS]->(d)`,
                        {
                            id: (user as any)._id.toString(),
                            dietaryPreference: dietaryPreference
                        }
                    );
            }

            for (const allergy of user.medical_condition.allergies) {
                if (allergy != EAllergies.none)
                    await this.session.run(
                    /* cypher */`MERGE (a:Allergy {name: $allergy}) 
                    WITH a
                    MATCH (u:User {id: $id})
                    CREATE (u)-[:ALLERGIC_TO]->(a)`,
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
            await this.session.run(
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

            await this.session.run(
                /* cypher */`MATCH (u:User {id: $id})-[c:HAS_CONDITION]->(m:MedicalCondition)
                DELETE c`,
                {
                    id: (user as any)._id.toString()
                }
            );

            for (const medicalCondition of user.medical_condition.chronicDiseases) {
                if (medicalCondition != EChronicDisease.none)
                    await this.session.run(
                    /* cypher */`MERGE (c:MedicalCondition {name: $medicalCondition}) 
                    WITH c
                    MATCH (u:User {id: $id})
                    CREATE (u)-[:HAS_CONDITION]->(c)`,
                        {
                            id: (user as any)._id.toString(),
                            medicalCondition: medicalCondition
                        }
                    );
            }

            await this.session.run(
                /* cypher */`MATCH (u:User {id: $id})-[d:PREFERS]->(dp:DietaryPreference)
                DELETE d`,
                {
                    id: (user as any)._id.toString()
                }
            );

            for (const dietaryPreference of user.medical_condition.dietary_preferences) {
                if (dietaryPreference != EDietaryPreferences.none)
                    await this.session.run(
                    /* cypher */`MERGE (d:DietaryPreference {name: $dietaryPreference}) 
                    WITH d
                    MATCH (u:User {id: $id})
                    CREATE (u)-[:PREFERS]->(d)`,
                        {
                            id: (user as any)._id.toString(),
                            dietaryPreference: dietaryPreference
                        }
                    );
            }

            await this.session.run(
                /* cypher */`MATCH (u:User {id: $id})-[a:ALLERGIC_TO]->(al:Allergy)
                DELETE a`,
                {
                    id: (user as any)._id.toString()
                }
            );

            for (const allergy of user.medical_condition.allergies) {
                if (allergy != EAllergies.none)
                    await this.session.run(
                    /* cypher */`MERGE (a:Allergy {name: $allergy}) 
                    WITH a
                    MATCH (u:User {id: $id})
                    CREATE (u)-[:ALLERGIC_TO]->(a)`,
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

    async addRecipe(recipe: IRecipe) {
        if (this._passive) return;
        try {
            await this.session.run(
                /* cypher */ `
                CREATE (r:Recipe { 
                    id: $id,
                    name: $name, 
                    description: $description, 
                    instructions: $instructions,
                    cookingTime: $cookingTime
                })`,
                {
                    id: (recipe as any)._id.toString(),
                    name: recipe.name,
                    description: recipe.description,
                    instructions: recipe.instructions,
                    cookingTime: recipe.cookingTime,
                    //TODO add to user - user reviews and rating -> recipe


                }
            );

            for (const ingredient of recipe.ingredients) {
                await this.session.run(
                    /* cypher */ `MERGE (i:Ingredient {name: $ingredient}) 
                    WITH i
                    MATCH (r:Recipe {id: $id})
                    CREATE (r)-[:CONTAINS {amount: $amount}]->(i)`,
                    {
                        id: (recipe as any)._id.toString(),
                        ingredient: ingredient.name,
                        amount: ingredient.amount
                    }
                );
            }

            for (const preferredMealTime of recipe.preferredMealTime) {
                await this.session.run(
                    /* cypher */ `
                    MERGE (p:PreferredMealTime {name: $preferredMealTime}) 
                    WITH p
                    MATCH (r:Recipe {id: $id})
                    CREATE (r)-[:PREFERRED_MEAL_TIME]->(p)`,
                    {
                        id: (recipe as any)._id.toString(),
                        preferredMealTime: preferredMealTime
                    }
                );
            }

            for (const medicalCondition of recipe.medical_condition.chronicDiseases) {
                if (medicalCondition != EChronicDisease.none)
                    await this.session.run(
                    /* cypher */`
                    MERGE (c:MedicalCondition {name: $medicalCondition}) 
                    WITH c
                    MATCH (u:Recipe {id: $id})
                    CREATE (u)-[:HAS_CONDITION]->(c)`,
                        {
                            id: (recipe as any)._id.toString(),
                            medicalCondition: medicalCondition
                        }
                    );
            }

            for (const dietaryPreference of recipe.medical_condition.dietary_preferences) {
                if (dietaryPreference != EDietaryPreferences.none)
                    await this.session.run(
                    /* cypher */`
                    MERGE (d:DietaryPreference {name: $dietaryPreference}) 
                    WITH d
                    MATCH (u:Recipe {id: $id})
                    CREATE (u)-[:PREFERS]->(d)`,
                        {
                            id: (recipe as any)._id.toString(),
                            dietaryPreference: dietaryPreference
                        }
                    );
            }

            for (const allergy of recipe.medical_condition.allergies) {
                if (allergy != EAllergies.none)
                    await this.session.run(
                    /* cypher */`
                    MERGE (a:Allergy {name: $allergy}) 
                    WITH a
                    MATCH (u:Recipe {id: $id})
                    CREATE (u)-[:ALLERGIC_TO]->(a)`,
                        {
                            id: (recipe as any)._id.toString(),
                            allergy: allergy
                        }
                    );
            }

            await this.session.run(
                /* cypher */ `
                MERGE (u:User {id: $userId, full_name: $fullName, profile_img: $profileImg}) 
                WITH u
                MATCH (r:Recipe {id: $id})
                CREATE (r)-[:CREATED_BY]->(u)`,
                {
                    id: recipe._id,
                    userId: recipe.user.user.toString(),
                    fullName: recipe.user.full_name,
                    profileImg: recipe.user.profile_img
                }
            );
        } catch (error) {
            console.error('Error adding recipe:', error);
            throw error;
        }
    }

    async updateRecipe(recipe: IRecipe) {
        if (this._passive) return;
        try {
            await this.session.run(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})
                SET r.name = $name, 
                    r.description = $description, 
                    r.instructions = $instructions,
                    r.cookingTime = $cookingTime
                `,
                {
                    id: (recipe as any)._id.toString(),
                    name: recipe.name,
                    description: recipe.description,
                    instructions: recipe.instructions,
                    cookingTime: recipe.cookingTime
                }
            );

            await this.session.run(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})-[c:CONTAINS]->(i:Ingredient)
                DELETE c
                `,
                {
                    id: (recipe as any)._id.toString()
                }
            );

            for (const ingredient of recipe.ingredients) {
                await this.session.run(
                    /* cypher */ `MERGE (i:Ingredient {name: $ingredient}) 
                    WITH i
                    MATCH (r:Recipe {id: $id})
                    CREATE (r)-[:CONTAINS {amount: $amount}]->(i)`,
                    {
                        id: (recipe as any)._id.toString(),
                        ingredient: ingredient.name,
                        amount: ingredient.amount
                    }
                );
            }

            await this.session.run(
                /* cypher */ `
                MATCH (r:Recipe {id: $id})-[p:PREFERRED_MEAL_TIME]->(t:PreferredMealTime)
                DELETE p
                `,
                {
                    id: (recipe as any)._id.toString()
                }
            );

            for (const preferredMealTime of recipe.preferredMealTime) {
                await this.session.run(
                    /* cypher */ `
                    MERGE (p:PreferredMealTime {name: $preferredMealTime}) 
                    WITH p
                    MATCH (r:Recipe {id: $id})
                    CREATE (r)-[:PREFERRED_MEAL_TIME]->(p)`,
                    {
                        id: (recipe as any)._id.toString(),
                        preferredMealTime: preferredMealTime
                    }
                );
            }

            await this.session.run(
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

}
