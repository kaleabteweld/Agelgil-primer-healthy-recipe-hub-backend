import mongoose, { Schema } from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { addModerator, checkIfUserOwnsRecipe, getById, getRecipeByShareableLink, getRecipesReview, removeByID, similarRecipes, update, validator } from './recipe.extended';
import { EPreferredMealTime, EPreparationDifficulty, ERecipeStatus, IRecipe, IRecipeMethods, IRecipeModel } from './recipe.type';
import CohereAI from '../../Util/cohere';
import ShareableLink from '../../Util/ShareableLink';
import { EAllergies, EChronicDisease, EDietaryPreferences, EDietGoals } from '../user/user.type';

const recipeSchema = new Schema<IRecipe, IRecipeModel, IRecipeMethods>({

    recipeEmbedding: [{ type: Number, select: false }],

    name: { type: String, required: true },
    description: { type: String },
    imgs: { type: [String] },
    preferredMealTime: { type: [String], enum: Object.values(EPreferredMealTime) },
    preparationDifficulty: { type: String, enum: Object.values(EPreparationDifficulty) },
    cookingTime: { type: Number },
    ingredients: [{
        ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient' },
        name: { type: String },
        amount: { type: Number },
        //TODo: remark: { type: String }
    }],
    instructions: { type: String },
    youtubeLink: { type: String },
    rating: { type: Number, default: 0 },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    totalReviews: { type: Number, default: 0 },

    status: { type: String, enum: Object.values(ERecipeStatus), default: ERecipeStatus.pending },
    moderator: {
        moderator: {
            moderator: { type: Schema.Types.ObjectId, ref: 'Moderator' },
            full_name: { type: String },
            profile_img: { type: String }
        },
        comment: { type: String }
    },

    nutrition: {
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
    },

    medical_condition: {
        chronicDiseases: { type: [String], enum: Object.values(EChronicDisease) },
        dietary_preferences: { type: [String], enum: Object.values(EDietaryPreferences) },
        allergies: { type: [String], enum: Object.values(EAllergies) },
        diet_goals: { type: [String], enum: Object.values(EDietGoals) },
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
        removeByID,
        addModerator,
        getRecipesReview,
        update,
        similarRecipes,
        checkIfUserOwnsRecipe,
        getRecipeByShareableLink,
    }
});

recipeSchema.virtual('shareableLink').get(function () {
    return ShareableLink.getInstance({}).getShareableLink((this as any)._id);
})

recipeSchema.plugin<any>(mongooseErrorPlugin);

recipeSchema.post('save', async function (doc) {

    const recipe: IRecipe = this;

    mongoose.model('Moderator').findById(doc.moderator?.moderator).then((moderator) => {
        if (moderator) {
            moderator.recipes.addToSet(doc._id);
            moderator.save();
        } else {
            throw new Error("Moderator not found");
        }
    }).catch((error) => {
        console.log("Error in saving moderator", error);
    });


    mongoose.model('User').findById(doc.user?.user).then((user) => {
        if (user) {
            user.my_recipes.addToSet(doc._id);
            user.save();
        } else {
            throw new Error("User not found");
        }
    }).catch((error) => {
        console.log("Error in saving user", error)
    });

    const isRunningInJest: boolean = typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined;
    const cohere = CohereAI.getInstance(process.env.COHERE_API_KEY, !isRunningInJest);


    cohere.embedRecipes(recipe).then((embedding) => {
        recipe.recipeEmbedding = embedding;
        recipe.save();
    }).catch((error) => {
        throw error;
    });
});

const RecipeModel = mongoose.model<IRecipe, IRecipeModel>('Recipe', recipeSchema);

export default RecipeModel;
