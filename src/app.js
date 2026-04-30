import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import corsOptions from "./config/corsOptions.js";
import routes from "./routes/index.js";
import errorHandler from "./shared/middleware/errorHandler.middleware.js";
import { apiLimiter } from "./shared/middleware/rateLimiter.middleware.js";
import AppError from "./utils/AppError.js";

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

export default app;
