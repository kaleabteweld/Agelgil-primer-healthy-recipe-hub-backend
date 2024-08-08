import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { getById, removeByID, validator } from './recipe.extended';
import { EPreferredMealTime, EPreparationDifficulty, ERecipeStatus, IRecipe, IRecipeMethods, IRecipeModel } from './recipe.type';

const recipeSchema = new Schema<IRecipe, IRecipeModel, IRecipeMethods>({
    name: { type: String, required: true },
    description: { type: String },
    imgs: { type: [String] },
    category: { type: String },
    preferredMealTime: { type: [String], enum: Object.values(EPreferredMealTime) },
    preparationDifficulty: { type: String, enum: Object.values(EPreparationDifficulty) },
    cookingTime: { type: Number },
    ingredients: [{
        Ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient' },
        amount: { type: Number }
    }],
    instructions: { type: String },
    rating: { type: Number, default: 0 },

    status: { type: String, enum: Object.values(ERecipeStatus), default: ERecipeStatus.pending },
    moderator: {
        moderator: { type: Schema.Types.ObjectId, ref: 'Moderator' },
        comment: { type: String }
    },

    user: {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        full_name: { type: String },
        profile_img: { type: String }
    }

}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID
    }
});


recipeSchema.plugin<any>(mongooseErrorPlugin);

const RecipeModel = mongoose.model<IRecipe, IRecipeModel>('Recipe', recipeSchema);

export default RecipeModel;
