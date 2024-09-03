import mongoose from "mongoose";
import { ValidationErrorFactory } from "../../Types/error";
import Joi from "joi";
import { BSONError } from 'bson';
import { EAllergies, EChronicDisease, EDietaryPreferences, IMedicalCondition, IUser, IUserDocument, IUserSearchFrom, TStatus } from "./user.type";
import UserModel from "./user.schema";


export class UserSearchBuilder {
    public query: mongoose.FilterQuery<IUserDocument> = {};
    private sortCriteria: { [key: string]: mongoose.SortOrder } = {};
    private page: number = 1;

    constructor(private model: mongoose.Model<IUserDocument> = UserModel, private pageSize: number = 10) { }

    withName(name: string): this {
        this.query.full_name = { $regex: new RegExp(name, 'i') };
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

    withStatus(status: TStatus): this {
        this.query.status = status
        return this
    }

    withVerified(verified: boolean): this {
        this.query.verified = verified
        return this
    }

    async execute(): Promise<IUser[]> {
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

    static async fromJSON(json: IUserSearchFrom): Promise<UserSearchBuilder> {
        const builder = new UserSearchBuilder();
        if (json.fullName) {
            builder.withName(json.fullName);
        }
        if (json.status) {
            builder.withStatus(json.status);
        }
        if (json.verified) {
            builder.withVerified(json.verified);
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
        return builder;
    }
}
