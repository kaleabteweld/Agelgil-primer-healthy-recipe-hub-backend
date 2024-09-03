import Joi from "joi";
import { IIngredientSearchFrom, INewIngredientFrom, IngredientUpdateFrom } from "./ingredient.type";


export const newIngredientSchema = Joi.object<INewIngredientFrom>({
    name: Joi.string().required(),
    type: Joi.string().required(),
    unitOptions: Joi.array().items(Joi.string()).required(),
    localName: Joi.string().required(),
});

export const ingredientUpdateSchema = Joi.object<IngredientUpdateFrom>({
    name: Joi.string().optional(),
    type: Joi.string().optional(),
    unitOptions: Joi.array().items(Joi.string()).optional(),
    localName: Joi.string().optional(),
});



export const ingredientSearchSchema = Joi.object<IIngredientSearchFrom>({
    name: Joi.string().optional(),
    type: Joi.string().optional(),
    localName: Joi.string().optional(),
    unitOptions: Joi.array().items(Joi.string()).optional(),
    sort: Joi.array().items(Joi.object({
        field: Joi.string().required(),
        order: Joi.string().valid('asc', 'desc').required(),
    })).optional(),
});