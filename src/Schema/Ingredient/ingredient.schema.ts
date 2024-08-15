import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { IIngredient, IIngredientMethods, IIngredientModel } from './ingredient.type';
import { getById, removeByID, validator, } from './ingredient.extended';


const ingredientSchema = new Schema<IIngredient, IIngredientModel, IIngredientMethods>({
    name: { type: String, required: true },
    type: { type: String },
    unit: { type: String },
    localName: { type: String },
    // imgs: { type: [String] },
    // nutritionalInformation: { type: Schema.Types.ObjectId, ref: 'NutritionalInformation' },
    // approved_moderators: { type: Schema.Types.ObjectId, ref: 'Moderator' }
}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID
    }
});


ingredientSchema.plugin<any>(mongooseErrorPlugin);

const IngredientModel = mongoose.model<IIngredient, IIngredientModel>('Ingredient', ingredientSchema);

export default IngredientModel;
