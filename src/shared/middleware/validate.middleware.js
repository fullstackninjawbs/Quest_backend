import AppError from "../../utils/AppError.js";

/**
 * Validates req.body against a Joi schema.
 * @param {Object} schema - Joi schema object
 */
const validateBody = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const message = error.details.map((d) => d.message).join(", ");
        return next(new AppError(message, 422));
    }
    next();
};

export default validateBody;
