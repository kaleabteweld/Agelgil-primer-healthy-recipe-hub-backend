import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { getById, removeByID, validator } from './mealPlanner.extended';
import { IMealPlanner, IMealPlannerMethods, IMealPlannerModel } from './mealPlanner.type';
import { EPreferredMealTime } from '../Recipe/recipe.type';

const mealPlannerSchema = new Schema<IMealPlanner, IMealPlannerModel, IMealPlannerMethods>({
    timeRange: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    meals: [{
        mealTime: { type: [String], enum: Object.values(EPreferredMealTime) },
        recipe: {
            type: Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true,
        }
    }]

}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID
    }
});


mealPlannerSchema.plugin<any>(mongooseErrorPlugin);


const MealPlannerModel = mongoose.model<IMealPlanner, IMealPlannerModel>('mealPlanner', mealPlannerSchema);

export default MealPlannerModel;
