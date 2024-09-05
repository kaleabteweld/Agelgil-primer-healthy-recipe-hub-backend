import mongoose from "mongoose";
import { IRecipe, IRecipeDocument, IRecipeSearchFrom, TPreferredMealTime, TPreparationDifficulty, TRecipeStatus } from "./recipe.type";
import RecipeModel from "./recipe.schema";
import { ValidationErrorFactory } from "../../Types/error";
import Joi from "joi";
import { BSONError } from 'bson';
import { EAllergies, EChronicDisease, EDietaryPreferences, IMedicalCondition } from "../user/user.type";


export class RecipeSearchBuilder {
    public query: mongoose.FilterQuery<IRecipeDocument> = {};
    private sortCriteria: { [key: string]: mongoose.SortOrder } = {};
    private page: number = 1;

    constructor(private model: mongoose.Model<IRecipeDocument> = RecipeModel, private pageSize: number = 10) { }

    withName(name: string): this {
        this.query.name = { $regex: new RegExp(name, 'i') };
        return this;
    }

    withPreferredMealTime(preferredMealTimes: TPreferredMealTime[]): this {
        this.query.preferredMealTime = { $in: preferredMealTimes }
        return this;
    }

    withPreparationDifficulty(preparationDifficulty: TPreparationDifficulty): this {
        this.query.preparationDifficulty = preparationDifficulty;
        return this;
    }

    withCookingTime(cookingTime: number): this {
        this.query.cookingTime = {
            $lte: cookingTime + 10,
            $gte: cookingTime - 10
        }
        return this;
    }

    withIngredients(ingredients: string[]): this {
        this.query["ingredients.name"] = { $all: ingredients };
        return this;
    }

    withSort(sort: { field: string, order: mongoose.SortOrder }[]): this {
        sort.forEach((s) => {
            this.sortCriteria[s.field] = s.order;
        });
        return this;
    }

    withMedicalCondition(medicalCondition: IMedicalCondition): this {
        this.query.medical_condition = medicalCondition;
        return this;
    }

    withChronicDiseases(chronicDiseases: EChronicDisease[]): this {
        this.query["medical_condition.chronicDiseases"] = { $in: chronicDiseases };
        return this;
    }

    withDietaryPreferences(dietaryPreferences: EDietaryPreferences[]): this {
        this.query["medical_condition.dietary_preferences"] = { $in: dietaryPreferences };
        return this;
    }

    withAllergies(allergies: EAllergies[]): this {
        this.query["medical_condition.allergies"] = { $in: allergies };
        return this;
    }

    withPagination(page: number = 1): this {
        if (page < 1) throw ValidationErrorFactory({
            msg: 'page must be greater than 1',
            statusCode: 400,
            type: "validation"
        }, "page");
        this.page = page;
        return this;
    }

    withStatus(status: TRecipeStatus): this {
        this.query.status = status
        return this
    }

    withRating(rating: number): this {
        this.query.rating = { $gte: rating }
        return this
    }

    withIngredientType(type: string): this {
        this.query["ingredients.type"] = type;
        return this;
    }

    async execute(): Promise<IRecipe[]> {
        try {
            console.log({ query: this.query, sort: this.sortCriteria });
            const skip = (this.page - 1) * this.pageSize;
            const result = await this.model
                .find(this.query)
                .sort(this.sortCriteria)
                .skip(skip)
                .limit(this.pageSize);
            return result;
        } catch (error) {
            if (error instanceof BSONError || error instanceof mongoose.Error.CastError) {
                throw ValidationErrorFactory({
                    msg: "Input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
                    statusCode: 400,
                    type: "validation",
                }, "organizerId");
            }
            throw error;
        }
    }

    static async fromJSON(json: IRecipeSearchFrom, schema: Joi.ObjectSchema<IRecipeSearchFrom>): Promise<RecipeSearchBuilder> {
        const builder = new RecipeSearchBuilder();
        if (json.name) {
            builder.withName(json.name);
        }
        if (json.cookingTime) {
            builder.withCookingTime(json.cookingTime);
        }
        if (json.preparationDifficulty) {
            builder.withPreparationDifficulty(json.preparationDifficulty);
        }
        if (json.preferredMealTime) {
            builder.withPreferredMealTime(json.preferredMealTime);
        }
        if (json.ingredients) {
            builder.withIngredients(json.ingredients);
        }
        if (json.sort) {
            builder.withSort(json.sort);
        }
        if (json.medical_condition) {
            if (json.medical_condition.chronicDiseases) {
                builder.withChronicDiseases(json.medical_condition.chronicDiseases);
            } else if (json.medical_condition.dietary_preferences) {
                builder.withDietaryPreferences(json.medical_condition.dietary_preferences);
            } else if (json.medical_condition.allergies) {
                builder.withAllergies(json.medical_condition.allergies);
            }
        }
        if (json.status) {
            builder.withStatus(json.status);
        }
        if (json.rating) {
            builder.withRating(json.rating);
        }
        return builder;
    }
}
