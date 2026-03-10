const AppError = require("../utils/AppError");

const handleCastError = (err) =>
    new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFields = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Duplicate value for field: ${field}`, 400);
};

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    return new AppError(`Validation Error: ${errors.join(". ")}`, 400);
};

const handleJWTError = () =>
    new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
    new AppError("Token expired. Please log in again.", 401);

const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};

const sendProdError = (err, res) => {
    if (err.isOperational) {
        res
            .status(err.statusCode)
            .json({ status: err.status, message: err.message });
    } else {
        console.error("UNHANDLED ERROR:", err);
        res
            .status(500)
            .json({ status: "error", message: "Something went wrong!" });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendDevError(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        if (err.name === "CastError") error = handleCastError(error);
        if (err.code === 11000) error = handleDuplicateFields(error);
        if (err.name === "ValidationError") error = handleValidationError(error);
        if (err.name === "JsonWebTokenError") error = handleJWTError();
        if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

        sendProdError(error, res);
    }
};
