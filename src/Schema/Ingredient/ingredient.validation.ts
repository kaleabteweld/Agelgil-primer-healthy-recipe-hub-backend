import Joi from "joi";
import { INewIngredientFrom, IngredientUpdateFrom } from "./ingredient.type";


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




