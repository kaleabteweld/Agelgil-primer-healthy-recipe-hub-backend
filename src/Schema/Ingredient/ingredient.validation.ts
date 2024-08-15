import Joi from "joi";
import { INewIngredientFrom, IngredientUpdateFrom } from "./ingredient.type";


export const newIngredientSchema = Joi.object<INewIngredientFrom>({
    name: Joi.number().required(),
    type: Joi.string().required(),
    unit: Joi.string().required(),
    localName: Joi.string().required(),
    // description: Joi.string().optional(),
    // imgs: Joi.array().items(Joi.string()).required(),
});

export const ingredientUpdateSchema = Joi.object<IngredientUpdateFrom>({
    name: Joi.number().optional(),
    type: Joi.string().optional(),
    unit: Joi.string().optional(),
    localName: Joi.string().optional
    // description: Joi.string().optional(),
    // imgs: Joi.array().items(Joi.string()).optional(),
});




