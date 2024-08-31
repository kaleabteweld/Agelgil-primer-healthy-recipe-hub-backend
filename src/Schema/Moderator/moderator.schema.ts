import mongoose from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { checkPassword, encryptPassword, getByEmail, getById, moderatedRecipes, removeByID, setStatus, update, validator, hasModeratedRecipe } from './moderator.extended';
import { EStatus, IModerator, IModeratorMethods, IModeratorModel } from './moderator.type';
import { ERecipeStatus } from '../Recipe/recipe.type';

export const moderatorSchema = new mongoose.Schema<IModerator, IModeratorModel, IModeratorMethods>({

    profile_img: { type: String, default: null },
    bio: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    phone_number: { type: String },
    status: { type: String, enum: Object.values(EStatus), default: EStatus.active },
    moderated_recipe: [{
        recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
        comment: { type: String },
        status: { type: String, enum: Object.values(ERecipeStatus) },
    }],

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret, opt) {
            delete ret['password'];
            return ret;
        }
    },
    statics: {
        validator,
        getByEmail,
        getById,
        removeByID,
        update,
        setStatus,
        moderatedRecipes,
    },
    methods: {
        encryptPassword,
        checkPassword,
        hasModeratedRecipe,
    }
});

moderatorSchema.virtual('full_name').get(function () {
    return `${this.first_name || ''} ${this.last_name || ''}`;
});

moderatorSchema.plugin<any>(mongooseErrorPlugin);

const ModeratorModel = mongoose.model<IModerator, IModeratorModel>('Moderator', moderatorSchema);

export default ModeratorModel;
