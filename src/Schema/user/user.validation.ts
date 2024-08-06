import Joi from "joi";
import { IUserSignUpFrom, IUserLogInFrom, IUserUpdateFrom } from "./user.type";


export const userSignUpSchema = Joi.object<IUserSignUpFrom>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone_number: Joi.string().required(),
});

export const userLogInSchema = Joi.object<IUserLogInFrom>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
});

export const userUpdateSchema = Joi.object<IUserUpdateFrom>({
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
    password: Joi.string().min(8).optional(),
});



