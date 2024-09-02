import Joi from "joi";
import { INewIngredientFrom, IngredientUpdateFrom } from "./ingredient.type";


export const newIngredientSchema = Joi.object<INewIngredientFrom>({
    name: Joi.number().required(),
    type: Joi.string().required(),
    unitOptions: Joi.array().items(Joi.string()).required(),
    localName: Joi.string().required(),
});

export const ingredientUpdateSchema = Joi.object<IngredientUpdateFrom>({
    name: Joi.number().optional(),
    type: Joi.string().optional(),
    unitOptions: Joi.array().items(Joi.string()).optional(),
    localName: Joi.string().optional(),
});




