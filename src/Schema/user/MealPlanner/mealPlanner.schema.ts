import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../../Middleware/errors.middleware';
import { checkIfUserDoseNotRecipe, checkIfUserHasRecipe, getById, getByUser, getNutritionGoal, getUserMeals, removeByID, removeRecipeFromMealPlan, validator } from './mealPlanner.extended';
import { EActivityLevel, EDietGoals, EGender, IMealPlanner, IMealPlannerMethods, IMealPlannerModel } from './mealPlanner.type';

const nutritionSchema = {
    sugar_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
    serving_size_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
    potassium_mg: { type: Number, default: 0 },
    fat_saturated_g: { type: Number, default: 0 },
    fat_total_g: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    cholesterol_mg: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbohydrates_total_g: { type: Number, default: 0 },
}

const nutritionGoalSchema = {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
}

const mealPlannerSchema = new Schema<IMealPlanner, IMealPlannerModel, IMealPlannerMethods>({

    nutritionGoal: nutritionGoalSchema,
    currentNutrition: nutritionGoalSchema,
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    userStats: {
        weights: { type: { date: Date, value: Number } },
        weight: Number,
        height: Number,
        age: Number,
        gender: { type: String, enum: Object.values(EGender) },
        activityLevel: { type: String, enum: Object.values(EActivityLevel) },
        diet_goals: { type: String, enum: Object.values(EDietGoals) },
    },
    recipes: {
        breakfast: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe', default: [] }],
            nutrition: nutritionSchema,
        },
        lunch: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe', default: [] }],
            nutrition: nutritionSchema,
        },
        dinner: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe', default: [] }],
            nutrition: nutritionSchema,
        },
        snacks: {
            recipe: [{ type: Schema.Types.ObjectId, ref: 'recipe', default: [] }],
            nutrition: nutritionSchema,
        }
    }

}, {
    timestamps: true,
    statics: {
        validator,
        getById,
        removeByID,
        getUserMeals,
        checkIfUserHasRecipe,
        checkIfUserDoseNotRecipe,
        removeRecipeFromMealPlan,
        getNutritionGoal,
        getByUser,
    }
});


mealPlannerSchema.plugin<any>(mongooseErrorPlugin);

const MealPlannerModel = mongoose.model<IMealPlanner, IMealPlannerModel>('MealPlanner', mealPlannerSchema);

export default MealPlannerModel;
