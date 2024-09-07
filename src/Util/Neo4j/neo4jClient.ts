import neo4j, { Session } from "neo4j-driver";
import { IUser } from "../../Schema/user/user.type";

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
    } catch(error: any) {
        console.error('Error fetching recipe recommendations:', error);
        throw error;
    }

    async addUser(user: IUser) {
        if (this._passive) return;
        try {
            console.log('Adding user to Neo4j:', user);
            await this.session.run(
                `CREATE (u:User { 
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
                await this.session.run(
                    `MERGE (c:MedicalCondition {name: $medicalCondition}) 
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
                await this.session.run(
                    `MERGE (d:DietaryPreference {name: $dietaryPreference}) 
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
                await this.session.run(
                    `MERGE (a:Allergy {name: $allergy}) 
                                         WITH a
                     MATCH (u:User {id: $id})
                     CREATE (u)-[:ALLERGIC_TO]->(a)`,
                    {
                        id: (user as any)._id.toString(),
                        allergy: allergy
                    }
                );
            }

            console.log('User added successfully.');
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

}