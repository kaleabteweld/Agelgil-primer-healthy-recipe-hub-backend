import mongoose from "mongoose";
import { ValidationErrorFactory } from "../../Types/error";
import Joi from "joi";
import { BSONError } from 'bson';
import { IIngredient, IIngredientDocument, IIngredientSearchFrom } from "./ingredient.type";
import IngredientModel from "./ingredient.schema";



export class IngredientSearchBuilder {
    public query: mongoose.FilterQuery<IIngredientDocument> = {};
    private sortCriteria: { [key: string]: mongoose.SortOrder } = {};
    private page: number = 1;

    constructor(private model: mongoose.Model<IIngredientDocument> = IngredientModel, private pageSize: number = 10) { }

    withName(name: string): this {
        this.query.name = { $regex: new RegExp(name, 'i') };
        return this;
    }
    withType(name: string): this {
        this.query.type = { $regex: new RegExp(name, 'i') };
        return this;
    }
    withLocalName(name: string): this {
        this.query.localName = { $regex: new RegExp(name, 'i') };
        return this;
    }
    withUnitOptions(optionals: string[]): this {
        this.query.unitOptions = { $in: optionals };
        return this;
    }

    withSort(sort: { field: string, order: mongoose.SortOrder }[]): this {
        sort.forEach((s) => {
            this.sortCriteria[s.field] = s.order;
        });
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


    async execute(): Promise<IIngredient[]> {
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

    static async fromJSON(json: IIngredientSearchFrom): Promise<IngredientSearchBuilder> {
        const builder = new IngredientSearchBuilder();
        if (json.name) {
            builder.withName(json.name);
        }
        if (json.localName) {
            builder.withLocalName(json.localName);
        }
        if (json.type) {
            builder.withType(json.type);
        }
        if (json.unitOptions) {
            builder.withUnitOptions(json.unitOptions);
        }
        if (json.sort) {
            builder.withSort(json.sort);
        }
        return builder;
    }
}
