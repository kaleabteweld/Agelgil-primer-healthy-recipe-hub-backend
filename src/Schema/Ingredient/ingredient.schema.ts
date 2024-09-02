import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { IIngredient, IIngredientMethods, IIngredientModel } from './ingredient.type';
import { getById, getUniqueType, getUniqueUnitOptions, removeByID, updateIngredient, validator, } from './ingredient.extended';


const ingredientSchema = new Schema<IIngredient, IIngredientModel, IIngredientMethods>({
    name: { type: String, required: true },
    type: { type: String },
    localName: { type: String },
    unitOptions: { type: [String] },

}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID,
        getUniqueType,
        getUniqueUnitOptions,
        updateIngredient,
    }
});


ingredientSchema.plugin<any>(mongooseErrorPlugin);

const IngredientModel = mongoose.model<IIngredient, IIngredientModel>('Ingredient', ingredientSchema);

export default IngredientModel;
