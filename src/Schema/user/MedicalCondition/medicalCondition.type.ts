import Joi from "joi";
import mongoose from "mongoose";


export interface IMedicalCondition extends mongoose.Document {
    health_status: string;
    show_health_status: boolean;
    dietary_preferences: string;
    show_dietary_preferences: boolean;
}

export interface IMedicalConditionMethods {
}

export interface IMedicalConditionDocument extends IMedicalCondition, IMedicalConditionMethods, mongoose.Document { }

export interface IMedicalConditionModel extends mongoose.Model<IMedicalConditionDocument> {
}

export interface INewMedicalConditionFrom {
    health_status: string;
    show_health_status: boolean;
    dietary_preferences: string;
    show_dietary_preferences: boolean;
}

export interface IMedicalConditionUpdateFrom extends Partial<INewMedicalConditionFrom> {
}


