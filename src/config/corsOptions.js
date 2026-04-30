import { FRONTEND_URL } from "./env.js";

const corsOptions = {
    origin: [FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

export default corsOptions;
