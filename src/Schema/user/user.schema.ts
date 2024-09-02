import mongoose from 'mongoose';
import { mongooseErrorPlugin } from '../Middleware/errors.middleware';
import { EAllergies, EChronicDisease, EDietaryPreferences, EDietGoals, EStatus, IUser, IUserMethods, IUserModel } from './user.type';
import {
    checkPassword, encryptPassword, getBookedRecipes, getByEmail, getById, getMyRecipes,
    removeByID, setStatus, toggleBookedRecipes, update, validator, hasBookedRecipe, updateUserStatus
} from './user.extended';

export const userSchema = new mongoose.Schema<IUser, IUserModel, IUserMethods>({
    profile_img: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    phone_number: { type: String },
    status: { type: String, enum: Object.values(EStatus), default: EStatus.active },
    booked_recipes: [{ type: mongoose.Types.ObjectId, ref: "Recipe" }],
    my_recipes: [{ type: mongoose.Types.ObjectId, ref: "Recipe" }],
    verified: { type: Boolean, default: false },

    medical_condition: {
        chronicDiseases: { type: [String], enum: Object.values(EChronicDisease) },
        dietary_preferences: { type: [String], enum: Object.values(EDietaryPreferences) },
        allergies: { type: [String], enum: Object.values(EAllergies) },
        // diet_goals: { type: [String], enum: Object.values(EDietGoals) },
    }

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
        getBookedRecipes,
        toggleBookedRecipes,
        getMyRecipes,
        updateUserStatus,
    },
    methods: {
        encryptPassword,
        checkPassword,
        hasBookedRecipe,
    }
});

userSchema.virtual('full_name').get(function () {
    return `${this.first_name || ''} ${this.last_name || ''}`;
});

userSchema.plugin<any>(mongooseErrorPlugin);

const UserModel = mongoose.model<IUser, IUserModel>('User', userSchema);

export default UserModel;
