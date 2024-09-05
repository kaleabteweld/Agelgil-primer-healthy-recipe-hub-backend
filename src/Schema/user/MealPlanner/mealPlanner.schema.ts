import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../../Middleware/errors.middleware';
import { getById, removeByID, validator } from './mealPlanner.extended';
import { IMealPlanner, IMealPlannerMethods, IMealPlannerModel } from './mealPlanner.type';

const nutritionSchema = {
    sugar_g: { type: Number },
    fiber_g: { type: Number },
    serving_size_g: { type: Number },
    sodium_mg: { type: Number },
    potassium_mg: { type: Number },
    fat_saturated_g: { type: Number },
    fat_total_g: { type: Number },
    calories: { type: Number },
    cholesterol_mg: { type: Number },
    protein_g: { type: Number },
    carbohydrates_total_g: { type: Number },
}

const mealPlannerSchema = new Schema<IMealPlanner, IMealPlannerModel, IMealPlannerMethods>({

    nutritionGoal: nutritionSchema,
    recipes: {
        breakfast: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe' }],
            nutrition: nutritionSchema,
        },
        lunch: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe' }],
            nutrition: nutritionSchema,
        },
        dinner: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe' }],
            nutrition: nutritionSchema,
        },
        snacks: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe' }],
            nutrition: nutritionSchema,
        }
    }

}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID,
    }
});


mealPlannerSchema.plugin<any>(mongooseErrorPlugin);

const MealPlannerModel = mongoose.model<IMealPlanner, IMealPlannerModel>('MealPlanner', mealPlannerSchema);

export default MealPlannerModel;
