const Joi = require("joi");

const registerSchema = Joi.object({
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Passwords do not match",
    }),
    company_name: Joi.string().required(),
    business_type: Joi.string().valid("DOT", "NON-DOT").optional(),
    dot_number: Joi.when("business_type", {
        is: "DOT",
        then: Joi.string().required(),
        otherwise: Joi.string().allow("", null).optional(),
    }),
    address: Joi.string().optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const otpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    type: Joi.string().valid("signup", "login", "reset").required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    password: Joi.string().min(8).required(),
});

module.exports = {
    registerSchema,
    loginSchema,
    otpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};

