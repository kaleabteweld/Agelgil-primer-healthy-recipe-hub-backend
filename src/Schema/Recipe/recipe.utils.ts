import mongoose from "mongoose";
import { IRecipe, IRecipeDocument, IRecipeSearchFrom, TPreferredMealTime, TPreparationDifficulty, TRecipeStatus } from "./recipe.type";
import RecipeModel from "./recipe.schema";
import { ValidationErrorFactory } from "../../Types/error";
import Joi from "joi";
import { BSONError } from 'bson';
import { IMedicalCondition } from "../user/user.type";


export class RecipeSearchBuilder {
    private query: mongoose.FilterQuery<IRecipeDocument> = {};
    private sortCriteria: { [key: string]: mongoose.SortOrder } = {};
    private page: number = 1;

    constructor(private model: mongoose.Model<IRecipeDocument> = RecipeModel, private pageSize: number = 10) { }

    withName(name: string): this {
        this.query.name = { $regex: new RegExp(name, 'i') };
        return this;
    }

    withPreferredMealTime(preferredMealTimes: TPreferredMealTime[]): this {
        if (!this.query.preferredMealTime) {
            this.query.preferredMealTime = [];
        }
        this.query.preferredMealTime = preferredMealTimes;
        return this;
    }

    withPreparationDifficulty(preparationDifficulty: TPreparationDifficulty): this {
        this.query.preparationDifficulty = preparationDifficulty;
        return this;
    }

    withCookingTime(cookingTime: number): this {
        this.query.cookingTime = cookingTime;
        return this;
    }

    withIngredients(ingredients: string[]): this {
        this.query["ingredients.Ingredient"] = { $in: ingredients };
        return this;
    }

    withSort(sort: { field: string, order: mongoose.SortOrder }[]): this {
        sort.forEach((s) => {
            this.sortCriteria[s.field] = s.order;
        });
        return this;
    }

    withMedicalCondition(medicalCondition: IMedicalCondition): this {
        this.query["medical_condition.chronicDiseases"] = { $in: medicalCondition.chronicDiseases };
        this.query["medical_condition.dietary_preferences"] = { $in: medicalCondition.dietary_preferences };
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

    async execute(): Promise<IRecipe[]> {
        try {
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
        await RecipeModel.validator(json, schema);
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
            builder.withMedicalCondition(json.medical_condition);
        }
        if (json.status) {
            builder.withStatus(json.status);
        }
        return builder;
    }
}
