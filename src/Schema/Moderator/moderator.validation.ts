import Joi from "joi";
import { IModeratorLogInFrom, IModeratorSignUpFrom, IModeratorUpdateFrom } from "./moderator.type";


export const moderatorSignUpSchema = Joi.object<IModeratorSignUpFrom>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone_number: Joi.string().required(),
    bio: Joi.string().required(),
    profile_img: Joi.string().optional(),
});

export const moderatorLogInSchema = Joi.object<IModeratorLogInFrom>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
});

export const moderatorUpdateSchema = Joi.object<IModeratorUpdateFrom>({
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
    password: Joi.string().min(8).optional(),
    bio: Joi.string().optional(),
    profile_img: Joi.string().optional(),
});



