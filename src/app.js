const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const corsOptions = require("./config/corsOptions");
const routes = require("./routes/index");
const errorHandler = require("./shared/middleware/errorHandler.middleware");
const { apiLimiter } = require("./shared/middleware/rateLimiter.middleware");
const AppError = require("./utils/AppError");

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Logger ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
    res.status(200).json({ status: "ok", uptime: process.uptime() })
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.all("*", (req, res, next) =>
    next(new AppError(`Route ${req.originalUrl} not found`, 404))
);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
