const { FRONTEND_URL } = require("./env");

const corsOptions = {
    origin: [FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

module.exports = corsOptions;
