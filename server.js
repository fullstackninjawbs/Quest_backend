require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { PORT } = require("./src/config/env");

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(
                `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
            );
        });

        // ─── Graceful Shutdown ────────────────────────────────────────────────────
        process.on("SIGTERM", () => {
            console.log("SIGTERM received. Shutting down gracefully...");
            server.close(() => {
                console.log("Process terminated.");
                process.exit(0);
            });
        });

        process.on("unhandledRejection", (err) => {
            console.error("UNHANDLED REJECTION:", err.message);
            server.close(() => process.exit(1));
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
};

startServer();