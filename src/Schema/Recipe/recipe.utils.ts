import mongoose from "mongoose";
import { IRecipe, IRecipeDocument, IRecipeSearchFrom, TPreferredMealTime, TPreparationDifficulty } from "./recipe.type";
import RecipeModel from "./recipe.schema";
import { ValidationErrorFactory } from "../../Types/error";
import Joi from "joi";
import { BSONError } from 'bson';


export class RecipeSearchBuilder {

    private query: mongoose.FilterQuery<IRecipeDocument> = {};
    private sortCriteria: Record<string, number> = {};
    private page: number = 1;


    constructor(private model: mongoose.Model<IRecipeDocument> = RecipeModel, private pageSize: number = 10) {
    }

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
        this.query = { "ingredients.Ingredient": ingredients };
        return this;
    }

    withPagination(page: number = 1): this {
        if (page < 1) throw ValidationErrorFactory({
            msg: 'page must be greater than 1',
            statusCode: 400,
            type: "validation"
        }, "page")
        this.page = page;
        return this;
    }

    async execute(): Promise<IRecipe[]> {
        try {
            const skip = (this.page - 1) * this.pageSize;
            const result = await this.model
                .find(this.query)
                .sort(this.sortCriteria as any)
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
        return builder;
    }
}